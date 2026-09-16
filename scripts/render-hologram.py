"""Render a seamless cubic hologram with a weighted neck rig and fixed shoulders.

Requires numpy, Pillow and ffmpeg. Source mesh attribution: scripts/assets/ai-head-license.txt.
Run with --preview to render three stills instead of encoding the video.
"""
import json
import math
from pathlib import Path
import struct
import subprocess
import sys

import numpy as np
from PIL import Image, ImageFilter, ImageChops, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SIZE = 900
FPS = 30
DURATION = 16


def load_mesh():
    raw = (ROOT / 'scripts/assets/ai-head.glb').read_bytes()
    json_size = struct.unpack_from('<I', raw, 12)[0]
    doc = json.loads(raw[20:20 + json_size])
    binary = raw[28 + json_size:]

    def accessor(index):
        acc = doc['accessors'][index]
        view = doc['bufferViews'][acc['bufferView']]
        count = {'SCALAR': 1, 'VEC3': 3}[acc['type']]
        dtype = {5123: '<u2', 5126: '<f4'}[acc['componentType']]
        offset = view.get('byteOffset', 0) + acc.get('byteOffset', 0)
        return np.frombuffer(binary, dtype=dtype, count=acc['count'] * count, offset=offset).reshape(-1, count)

    return accessor(1), accessor(2), accessor(0).reshape(-1, 3)


def surface_points():
    vertices, normals, indices = load_mesh()
    triangles = vertices[indices]
    normal_triangles = normals[indices]
    low = triangles[:, :, 1].min(axis=1)
    high = triangles[:, :, 1].max(axis=1)
    points, point_normals = [], []
    for y in np.arange(-3.93, 3.97, 0.044):
        mask = (low <= y) & (high > y)
        for tri, norm in zip(triangles[mask], normal_triangles[mask]):
            intersections = []
            for a, b in ((0, 1), (1, 2), (2, 0)):
                if (tri[a, 1] <= y < tri[b, 1]) or (tri[b, 1] <= y < tri[a, 1]):
                    t = (y - tri[a, 1]) / (tri[b, 1] - tri[a, 1])
                    intersections.append((tri[a] + t * (tri[b] - tri[a]), norm[a] + t * (norm[b] - norm[a])))
            if len(intersections) != 2:
                continue
            (a, na), (b, nb) = intersections
            # Quantize along the dominant horizontal axis to create ordered dot rows.
            axis = 0 if abs(b[0] - a[0]) >= abs(b[2] - a[2]) else 2
            if a[axis] > b[axis]:
                a, b, na, nb = b, a, nb, na
            for value in np.arange(math.ceil(a[axis] / 0.045) * 0.045, b[axis], 0.045):
                t = (value - a[axis]) / (b[axis] - a[axis])
                points.append(a + t * (b - a))
                point_normals.append(na + t * (nb - na))
    p = np.array(points)
    n = np.array(point_normals)
    n /= np.linalg.norm(n, axis=1)[:, None]
    return p, n


POINTS, NORMALS = surface_points()
# The source scan has closed eyes. Build small almond-shaped digital eyes so the
# character can actually look around; retain the scan's natural nose and lips.
eye_window = np.zeros(len(POINTS), dtype=bool)
eye_points, eye_normals, eye_centers = [], [], []
for center in (-.61, .61):
    u = (POINTS[:, 0] - center) / .34
    v = (POINTS[:, 1] - 1.69) / .125
    eye_window |= (u*u + v*v < 1) & (POINTS[:, 2] > 1.35)
    for u in np.arange(-.32, .33, .026):
        extent = .115 * max(0, 1 - (u/.33)**2)**.7
        for v in np.arange(-extent, extent, .025):
            # Follow the socket's curvature so the far eye stays inside the head silhouette.
            depth = 1.95 - max(abs(center+u)-.50, 0) * 1.05
            eye_points.append([center+u, 1.69+v, depth])
            eye_normals.append([np.sign(center)*.35, 0, .937])
            eye_centers.append(center)
POINTS, NORMALS = POINTS[~eye_window], NORMALS[~eye_window]
EYE_START = len(POINTS)
POINTS = np.vstack([POINTS, eye_points])
NORMALS = np.vstack([NORMALS, eye_normals])
EYE_CENTERS = np.array(eye_centers)
PHASE = POINTS[:, 0] * 17 + POINTS[:, 1] * 31 + POINTS[:, 2] * 13


def smoothstep(value):
    value = np.clip(value, 0, 1)
    return value * value * (3 - 2 * value)


def head_pose(time):
    # Unequal glances and holds make the attention feel intentional, not pendular.
    keys = [(0, 0, 0, 0), (1.0, 0, 0, 0), (3.1, -25, -1.3, 1.4),
            (4.6, -25, -1.0, 1.0), (6.6, -5, 1.0, -0.6),
            (7.5, -5, 0.5, -0.3), (9.8, 29, -1.6, -1.3),
            (11.7, 29, -1.1, -0.8), (14.6, 0, 0, 0), (16, 0, 0, 0)]
    time %= DURATION
    for a, b in zip(keys, keys[1:]):
        if a[0] <= time <= b[0]:
            t = (time - a[0]) / (b[0] - a[0])
            ease = t**3 * (10 - 15*t + 6*t*t)
            return np.radians(np.array(a[1:]) * (1-ease) + np.array(b[1:]) * ease)
    return np.zeros(3)


def articulate(points, normals, time):
    yaw, pitch, roll = head_pose(time)
    ry = np.array([[np.cos(yaw), 0, np.sin(yaw)], [0, 1, 0], [-np.sin(yaw), 0, np.cos(yaw)]])
    rx = np.array([[1, 0, 0], [0, np.cos(pitch), -np.sin(pitch)], [0, np.sin(pitch), np.cos(pitch)]])
    rz = np.array([[np.cos(roll), -np.sin(roll), 0], [np.sin(roll), np.cos(roll), 0], [0, 0, 1]])
    rotation = rz @ rx @ ry
    weight = smoothstep((points[:, 1] + 2.05) / 1.25)[:, None]
    pivot = np.array([0, -1.35, 0])
    turned = (points - pivot) @ rotation.T + pivot
    return points * (1-weight) + turned * weight, normals * (1-weight) + (normals @ rotation.T) * weight


CELL = np.floor((POINTS + 10) / 0.27).astype(int)
CELL_RANDOM = (np.sin(CELL @ np.array([127.1, 311.7, 74.7])) * 43758.5453) % 1
# Preserve the nose, lips and eyes; fracture the temples, crown, cheeks and shoulders.
FACE_SAFE = (np.abs(POINTS[:, 0]) < 0.86) & (POINTS[:, 1] > -0.6) & (POINTS[:, 1] < 2.35) & (POINTS[:, 2] > 1)
FRACTURE = (CELL_RANDOM > 0.88) & ~FACE_SAFE
FRACTURE &= (np.abs(POINTS[:, 0]) > 1.10) | (POINTS[:, 1] > 2.65)
# Connected right-angle fissures follow the voxel lattice instead of organic cracks.
crack_x = -1.22 + .18 * (np.floor((POINTS[:, 1]-1.1)/.36).astype(int) % 2)
left_crack = (np.abs(POINTS[:, 0]-crack_x) < .037) & (POINTS[:, 1] > 1.9) & (POINTS[:, 1] < 3.55)
crack_y = 2.85 + .18 * (np.floor((POINTS[:, 0]+.8)/.36).astype(int) % 2)
crown_crack = (np.abs(POINTS[:, 1]-crack_y) < .035) & (np.abs(POINTS[:, 0]) < .9)
FRACTURE |= (left_crack | crown_crack) & (POINTS[:, 2] > .3)

# Detached cubes share the head rig and move a little farther from the broken edge.
FRAGMENT_IDS = np.flatnonzero(FRACTURE & (NORMALS[:, 2] > 0.25))[::48]


def project(points):
    perspective = 17 / (17 - points[:, 2])
    return np.stack([SIZE/2 + points[:, 0] * SIZE * .096 * perspective,
                     SIZE*.5 - points[:, 1] * SIZE * .096 * perspective], axis=1)


def render(time):
    living_points = POINTS.copy()
    blink = 0
    for blink_time in (5.35, 12.55):
        blink = max(blink, max(0, 1-abs(time-blink_time)/.13))
    living_points[EYE_START:, 1] = 1.69 + (living_points[EYE_START:, 1]-1.69) * (1-blink*.96)
    p, n = articulate(living_points, NORMALS, time)
    x, y = project(p).T
    front = np.clip(n[:, 2], 0, 1)
    key = np.maximum(0, n @ np.array([-0.48, 0.45, 0.75]))
    rim = (1 - np.abs(n[:, 2])) ** 3
    shimmer = 0.94 + 0.06 * np.sin(PHASE + time * math.tau / 4)
    scan = 0.5 + 0.5 * np.cos(POINTS[:, 1] * 1.5 - time * math.tau / 8)
    light = (0.14 + 0.66 * key + 0.14 * rim + 0.04 * scan) * shimmer
    light *= np.where(n[:, 2] > 0, 0.45 + 0.55 * front ** 0.3, 0)
    light *= np.clip((POINTS[:, 1] + 4) / 1.2, 0, 1)

    # Render the volume as light points only; no skin texture or opaque surface.
    rgb = np.stack([100 + 95 * light, 35 + 115 * light, 210 + 45 * light], axis=1) * light[:, None]
    # Eyes lead each head turn very slightly, with dark pupils and no laser glow.
    gaze = np.sin(head_pose((time+.35) % DURATION)[0]) * .13
    iris = np.sqrt((POINTS[EYE_START:, 0] - EYE_CENTERS - gaze)**2 + (POINTS[EYE_START:, 1]-1.69)**2)
    rgb[EYE_START:] = np.where((iris < .075)[:, None], [13, 5, 25], np.where((iris < .105)[:, None], [70, 42, 115], [42, 28, 70]))
    buffer = np.zeros((SIZE, SIZE, 3), dtype=np.float32)
    ix, iy = np.floor(x).astype(int), np.floor(y).astype(int)
    fx, fy = x - ix, y - iy
    valid = (ix > 2) & (iy > 2) & (ix < SIZE - 3) & (iy < SIZE - 3)
    # A depth prepass prevents rear/interior surfaces showing through the lips and eyes.
    depth = np.full((SIZE, SIZE), -100, dtype=np.float32)
    for dy in range(-2, 3):
        for dx in range(-2, 3):
            np.maximum.at(depth, (iy[valid]+dy, ix[valid]+dx), p[valid, 2])
    valid &= p[:, 2] >= depth[np.clip(iy, 0, SIZE-1), np.clip(ix, 0, SIZE-1)] - .13
    valid &= ~FRACTURE
    # Square light cells retain their black gutters; only a restrained halo is added.
    for dx, dy, weight in ((0, 0, (1-fx)*(1-fy)), (1, 0, fx*(1-fy)), (0, 1, (1-fx)*fy), (1, 1, fx*fy)):
        for sx, sy in ((0, 0), (1, 0), (0, 1), (1, 1)):
            np.add.at(buffer, (iy[valid] + dy + sy, ix[valid] + dx + sx), rgb[valid] * weight[valid, None] * 1.1)
    dots = Image.fromarray(np.uint8(np.clip(buffer, 0, 255)))
    draw = ImageDraw.Draw(dots)
    offsets = np.array([[-1,-1,-1], [1,-1,-1], [1,1,-1], [-1,1,-1], [-1,-1,1], [1,-1,1], [1,1,1], [-1,1,1]])
    for order, index in enumerate(FRAGMENT_IDS):
        if n[index, 2] < .05:
            continue
        displacement = .14 + .14 * (.5 + .5 * math.sin(time * math.tau / 8 + order))
        center = POINTS[index] + NORMALS[index] * displacement
        center[0] += np.sign(center[0]) * displacement * .65
        radius = .036 + (order % 4) * .018
        corners, _ = articulate(center[None, :] + offsets * radius, np.tile(NORMALS[index], (8, 1)), time)
        xy = project(corners)
        draw.polygon([tuple(xy[i]) for i in (4,5,6,7)], fill=(77,39,130))
        draw.polygon([tuple(xy[i]) for i in (1,2,6,5)], fill=(45,20,85))
        for a, b in ((0,1),(1,2),(2,3),(3,0),(4,5),(5,6),(6,7),(7,4),(0,4),(1,5),(2,6),(3,7)):
            draw.line([tuple(xy[a]), tuple(xy[b])], fill=(145,96,220), width=1)
    halo = dots.filter(ImageFilter.GaussianBlur(1.5))
    return ImageChops.add(dots, halo)


def main():
    output = ROOT / 'public/videos'
    output.mkdir(parents=True, exist_ok=True)
    print(f'Rendering {len(POINTS):,} holographic surface points', flush=True)
    if '--preview' in sys.argv:
        for time, suffix in [(0, 'front'), (4, 'right'), (11, 'left')]:
            render(time).save(output / f'hologram-preview-{suffix}.png')
    else:
        render(0).save(output / 'ai-hologram-purple-cubic-poster.jpg', quality=94)
        destination = output / 'ai-hologram-purple-cubic.mp4'
        temporary = destination.with_suffix('.rendering.mp4')
        command = ['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{SIZE}x{SIZE}', '-r', str(FPS), '-i', '-', '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(temporary)]
        encoder = subprocess.Popen(command, stdin=subprocess.PIPE)
        try:
            for frame in range(FPS * DURATION):
                encoder.stdin.write(render(frame / FPS).tobytes())
                if frame % FPS == 0:
                    print(f'{frame // FPS}/{DURATION} seconds', flush=True)
        finally:
            encoder.stdin.close()
        if encoder.wait() != 0:
            raise RuntimeError('Video encoding failed')
        temporary.replace(destination)
        print('Video complete', flush=True)


if __name__ == "__main__":
    main()
