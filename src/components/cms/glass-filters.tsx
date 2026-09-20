/**
 * Liquid-glass SVG filters.
 *
 * Reflection rules (encoded as SVG primitives):
 * 1) Specular (Phong): upper-left light → bright glass rim via feSpecularLighting
 * 2) Soft refraction: fractal noise → blur → feDisplacementMap bends the backdrop
 * 3) Floor reflection: vertical blur + alpha fade + weak specular for under-content mirror
 */
export function CmsGlassFilters() {
  return (
    <svg
      className="cms-glass-svg"
      width="0"
      height="0"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <filter
          id="cms-glass-distort"
          x="0%"
          y="0%"
          width="100%"
          height="100%"
          filterUnits="objectBoundingBox"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.01 0.01"
            numOctaves="1"
            seed="5"
            result="turbulence"
          />
          <feComponentTransfer in="turbulence" result="mapped">
            <feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5" />
            <feFuncG type="gamma" amplitude="0" exponent="1" offset="0" />
            <feFuncB type="gamma" amplitude="0" exponent="1" offset="0.5" />
          </feComponentTransfer>
          <feGaussianBlur in="turbulence" stdDeviation="3" result="softMap" />
          <feSpecularLighting
            in="softMap"
            surfaceScale="5"
            specularConstant="1"
            specularExponent="100"
            lightingColor="#ffffff"
            result="specLight"
          >
            <fePointLight x="-200" y="-200" z="300" />
          </feSpecularLighting>
          <feComposite
            in="specLight"
            operator="arithmetic"
            k1="0"
            k2="1"
            k3="1"
            k4="0"
            result="litImage"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="softMap"
            scale="120"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        <filter
          id="cms-glass-reflect"
          x="-8%"
          y="-8%"
          width="116%"
          height="130%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.4 2.2" result="blur" />
          <feComponentTransfer in="blur" result="faded">
            <feFuncA type="linear" slope="0.5" intercept="0" />
          </feComponentTransfer>
          <feSpecularLighting
            in="faded"
            surfaceScale="2"
            specularConstant="0.4"
            specularExponent="45"
            lightingColor="#ffffff"
            result="floorSpec"
          >
            <fePointLight x="100" y="-60" z="140" />
          </feSpecularLighting>
          <feComposite
            in="faded"
            in2="floorSpec"
            operator="arithmetic"
            k1="0"
            k2="1"
            k3="0.3"
            k4="0"
          />
        </filter>
      </defs>
    </svg>
  );
}
