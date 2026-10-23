'use client';

import { useRef, useEffect } from 'react';

// --- Types ---

interface AsciiArtProps {
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: React.CSSProperties;
  interactive?: boolean;
  mouseMode?: 'push' | 'attract';
  hoverStrength?: number;
  areaSize?: number;
  spread?: number;
  animation?: 'none' | 'noise-field' | 'intervals' | 'beam-sweep' | 'glitch' | 'crt';
  onReady?: () => void;
}

// --- Embedded Data ---
const ASCII_DATA = {"cols":48,"rows":56,"frames":[{"chars":"                                                \n                                                \n                      ..                        \n                 ..                             \n                    ..I\"...                     \n               . _t`  ;`    ...                 \n               . <{`.`>i!l^                     \n                  ,?+-??_+<i,`^                 \n            ..   _)]?-_~<>>!l{j                 \n              .`[}?-_>i>~i;,`i<`                \n          . <<.-j<+>><<illI;\"\";;.               \n          . >+ ][-~<!l>iII!I:\",;\" .             \n          . <c!__~~~>ii>ii!;:\"\",:...            \n          . I}-(~!~<<>>><il;,\"^,;.              \n              lf+i<ii!!i!I;::,^\"^^|; .          \n          . -;i)~il:,:;I:\"\",,\"\",``-\" .          \n          . ~:<{III;\"^lI``,:\".^:\"               \n              >1li!i>i?l,!<~i!^,\"...            \n        . :`^,-[<i>i~?{I,!i!!<:\";;.             \n        . !^^\"]}~+<<<[}l,:!l;:,,^:: .           \n            ..>1~_++~(-!::!il;\",^;\" .           \n          . ,<!{~++<__::^:!l;:\",,~^ .           \n          . ;1~[++~<<Il,,:il:\"\",:l` .           \n          . /z~!+~<~+_~<I;ll:\"\"::^.             \n            :l,:+<<~<!lI,::;:\",:^.              \n               _}><iIl!l;::;:^:,                \n            ...I{>ii<<!I;::;,^:`..              \n              ..+~i><i!!I;:,^\",                 \n                -_i><~~<!I:\"^,:.                \n            . ;,~-!i>>>!I:^^,::.                \n            . {_ >ilI:,,\"^^:,^,.                \n               .\"++~;^^``^,;\"\",.                \n            . !?.-~~!\"^^^\"\"^\",,.                \n             .  \"_+<iI;,\"^`\",\",  .              \n         ..`l.`>f]<~>!!I:\"^,:^,,.   .           \n      ...  .: ~\\t]~<<ilI:\"\":,\",;l:`   ...       \n.   .    `,!<!?}}?<<<i!I;::;,,\":Ill;\".    .     \n      `\";>~+_?-?}_~<>i!lI;;;:,\",lil!ilI~^   ..  \n:..`;!i><<~~+_?~,<_~<i!lIll;;:,^)ni>i.lx>:\"`   .\n: `~>!<~~<<<<<<I.<-+~<iii>>ll;:^<-!ii:;!i>i!:`  \n:Ii+`.iI:>i>ii;!<<~~+<><~+~>!lII;:l:,|_!>>>ii!:`\n]__+!>>!l~<<><<~~~<~<>><+++>i!ll!l!::z]l;^!>ii!!\n-_++]?+___++~<<<~<<>>i!>~+~<>iiiiii;Iui~(`l>::;I\n_+~<[v( :-+++~~<<~<<>ii>~+~<>ii>>ii!!!.l-iii~_..\n<>>>!{[,I<<<<>>>>>>>i!l!>><>iii:;illI:,:Ii!Ilj!,\n!!lllIIi!!!!!!I!!llllIIIl!!!llI;IIII^`I\"`1?:^ `,\n;:.,IIIIIIIII;~;,;;;:::;;;I;;;;;;;:::,,,\"::,,,\"^\n ^.^,,,\"\",,,,\"+\" \"\"\"\"\"\"\"\"\",,,,,,,\"\"\"\"\"\"\"\"\"\"\"^^`.\n` .......`...,f+.``.......````````````````....  \n`. ^+      ..`jj .              . ...           \n   .\".      . ^l .                              \n                                                \n    .         ..                                \n                                                \n                                                \n                                                ","colors":"p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6por5por5p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6por5por4p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6por5por5lXzgn4Tupor5por4por5p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6pYn3p4v6gGvAYFCPpIj1p4v6p4v6l37joofzp4v6p4v6p4v6p4v6por5por5por5p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6por4p4v6iHHMcl+ro4j1pIn2pIj2i3TRjXbUjnbVkXjZn4Xvp4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6nIHpfWi7gmzDf2m+e2a4fGe6gWvBg23Fh3HLjnbUm4Hpo4j0oIXvp4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6por4por4p4v6p4v6p4v6gWzCbVukeWW2e2e5fmm9gWvBhW7Hh3HLiXLOinPPjnbVknrbcV6pXE2Kp4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6por5o4f0dmKxdWGvfGe6fmm9gGvAiXLOjXbUinPPhnDKjXXUln3hm4HppIj1jHTSiHHLo4j1p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6por4p4v6iHHLh3HLpor5fWi7XE2Lh3DKg23EinPPinPPiHHMiXLNjXXTkXjZknnblXzfln3hnoPsnYPrl37jl37jpYn3p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6por4p4v6i3TQg23Ep4v6emW2dmKxfWi7hW7Hh3DLj3fXkXnZi3PQjXXTlHvelHvdj3fWk3vdmX/lnYPsm4HomH7jnYPsp4v6por5p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6pYr4p4v6iHHMTUB0j3fWgGvAgWzChW/IhW/IhW/IiXLOjHTSi3TRi3PQjHTRjHXSkHjYln3hmoDnnoTtnoTtm4HomYDmpor5pYr4por5p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6por4p4v6lHvedWGvfWi8a1mhhW7Hj3fWhW7Hh3HLiHHMiXLOinPQiXLOiXLNjHXSkXnal33im4HonYProIXvnILqmH7jpor5p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6kXnaXk6NhG7GjXXTiHHLjHXTjnbVj3fWj3fWjXbUj3fWk3rdln3hmH7kmoDnnILqn4XvnYPsoIXvoobyZ1abl37jp4v6por5p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6por4p4v6f2q+ln3ijXXTbVujhm/IjHXTknrbmYDmm4HomX/lln3hlXzfmX/lnoPtn4TunILqm4HonYLrnoTtnILqo4j1o4j1f2q/nYPsp4v6por5p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6por4p4v6hm/JmoDmiXLNcV6qk3rck3rclXzfl37jnoPtoIXwkXjZlXzfpIj2oofzmoDnmX/lnYPrpIn2oIXwmoDmnoPsp4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6i3TQcF2oknnajXXTj3fWjHTRiXLNjXXTe2a4k3rcnILqjnbWh3DKhnDKjHTSkHjXoYbym4Hpn4TupIn2pYn3por5p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6por5p4v6moDno4j1oYbxm4Hofmm9eGSzh3HLjXXTi3TQjHTRhW7He2a4cl+rlXzfmoDnj3fWjnbUkHjXkHfXiHHMmX/lnoPtl33il33ipIn2p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6por5p4v6jnbVoIXwn4TvnYLremW3dGGvhm/Jg23EiHHMh3DLh3DKeGSzdGCtknnam4HomoDnkHjYknnaln3gmX/lnILqm4HpoIXvmYDmmX/lp4v6por5p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6pIn2pIn2inPOblylhW7HgmzCgmzEg23EhG7GaVief2q+jnbVmH7kmH/kkHjYjXbUkXnZl33inYPrm4HooIXwl37inYPrp4v6por5p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6pYr4p4v6m4Hoh3DKjnbVcl+rhnDJgmzDg23FiHHMgWvBgWzCmX/lmoDmn4TvmX/ljnbVkXjZln3hmoDmn4TunILqnILqhm/Ioobyp4v6por5p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6por5p4v6l37iblylhW/IdmKxg23EhG7Ghm/IiXLNh3DKk3vdkXjZm4HpmoDnmX/mjnbVkXjZmH/knYPrn4TunILqmX/lkXjZo4j1p4v6por5p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6por4p4v6Y1KUSz5xhG7GkHfXg23Ehm/Jh3HLhm/JhG7GgmzChnDKiXLNlXzfl33iknrbk3rcmH/knYPrn4TumX/lmH7kn4Xvpor5p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6mH/kkXjZmoDnmoDnhG3FiXLNh3HLhm/JiHHMj3fWkXnalXzfmoDnmoDmmX/ll37imX/ln4TunYLrmYDmoYbxpIn2p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6f2q/dWGvinPOiXLNjHXSk3rdkXnajnbVkXnal33imoDnmoDnmH7jmoDnoIXwmX/lnILqp4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6por4pYn3por5lXzfcl+rinLOjHXSjHXSiHHMh3HLj3fXk3vdlXzgmoDnmH7jln3hm4HooIXvmH/ko4j1por5por5p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6pYr4pYr4gmzDhG7GjXXTinPPiHHMjHXSj3fXj3fWk3rcl33imX/mmoDnn4TvnoTtnILqp4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6fmm9gGvAjXXUi3PQiHHMhW/IhW/IiHHMjnbVlHvdmoDmn4TuoYbxmoDomH/kpYr4p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6por5p4v6lXzgm4HohW/Ifmm8jnbVjnbUinPPinPPi3PQj3fWlHvemYDmn4TvoYbxnYLrmYDmmH/kpYn3p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6por4p4v6cl+rgWvCp4v6inPPjHTSknnblXzfmX/lmoDnnILpnoTtoYbyoYbxmoDnmoDnoIXwm4HopYr4p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6pIn2n4TugmzDgm3EhW/Hl37joIXvoobyoofyoofzoIXwm4Hpl33inoPsnoPsnIHppor4p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6pYn3p4v6j3fXe2a5pYn3f2q+hm/IhW/Ij3fWnYProYbxoobyoYbxn4TunoPsn4XvnoPtnILqnYLrpor5p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6por5p4v6p4v6n4TugWvBhG7GiXLNjXXTlXzfmH7jm4HonoTtoYbxoobyn4TumoDnnoPsnILqp4v6p4v6por5p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6por5por5pIj1knnbpor4oofzi3TQX0+Oema3iHHMhm/Ii3PQj3fXkHjYlHvdmYDmnoPtoIXwm4HpmoDmn4Xvm4HomoDnpIn2p4v6p4v6p4v6por5p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6por5por5por5p4v6p4v6por5mYDmp4v6hnDJZVSYYVGSeWW2hG7Gh3DKiHHMjHXSkXnZlXzfmoDmnYLrnYLrmX/lm4HonoPtnILqln3hknrbmoDnpIj1p4v6p4v6p4v6por5pYr4por5p4v6p4v6p4v6p4v6p4v6p4v6p4v6por5p4v6p4v6p4v6por5p4v6p4v6p4v6p4v6pIj1m4HpkHjYiHHMj3fXe2a4dWGvdGCtfWi7iHHLh3DKiXLNjHTRkHjYlHvel37imoDnmYDml37jm4Hpm4HonYPrmoDnlXzfknrbknrbl37inoTtpIn2p4v6p4v6p4v6p4v6por5p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6o4j0nYLrln3hinPPhm/Jg23FgGvAfGe6fmm9ema4c2Ctf2q/hW/Hh3DKiXLOjHTSj3fXknnalXzfl37iln3gl33imoDmm4HonoPtnILqknnbjnbUkXjZjnbVjXXTk3rck3vdhW/Ioobyp4v6p4v6p4v6por5por5p4v6p4v6mH7kpor5por5o4j0lXzgjnbVjXXTinPPh3HLiHHMhm/IhW/IgmzDgWzCfGe5hm/Im4HpiHHMgGvAhW/IiHHMjHTRj3fWkXjZk3rcknnakXnZlXzgl37imX/lnILqoYbxbFmhU0V9jXbUinPPjXXTpor5kXjZWEmDinLOmoDmnoPso4j1p4v6p4v6p4v6por5mX/lp4v6pIj1h3DKi3TRkHjYh3DKhW/HhnDJiHHMiXLNiXLNh3HLiHHMiHHMlHvdpor4h3DLf2q+gmzDhG7GiXLNjXXTjXXTjXXTiXLOi3TQknnbk3rclnzgmoDnn4Tvh3HLfmm9kHjXjHXSjHXSmYDmlXzgkHfXjHXSi3TQjnbUj3fXmH7jo4f0p4v6p4v6mH/kk3vdjXXTg23EoofzpYn3jHTRk3rdmH7kiXLOjHXSi3TRjHTSjXbUmH7jkHfXiHHMh3DKhW7HhG7HhG7GiHHMi3TQiXLNhm/IhG7GhnDJi3TQkHjXk3rclXzflHvel37jmH/kknrbmoDmmoDnZ1aagGrAj3fXi3PQinPPinLOjHTSjHTSkHjYmoDno4j1eWW2gWvBgWzChG7GjnfWi3TRinPQj3fXkHjZhnDJiHHLiXLNinPPiHHMh3HLhW/IhnDJhm/Ih3DKhnDJiHHNi3PQi3TRiXLNhG7Gg23FhG7GiXLOjHXSj3fWknrbkXjZkHjYknrbj3fWmH/kmX/lSj5weWW2kXnZln3hoYbxjnbWinLOjXXTjHXSjnbVkHjYfmm9gWvBg23EhG7GeWW2fGe6gmzDgWvBgGvAgWzCgmzEhG7GhW7Hh3DKh3DLiXLNhnDJiHHLh3DKiXLOinPPjXXTjnbViXLOhW7HhG3FhW/Ih3DLi3TRjXXTjHXSjXbUjXXTjHTRjHXSlXzglHveUUR6jHTShm/IalifoofzkXnZinPOmoDnmoDmln3hlHvegGrAg23EhG7HiHHLd2OzT0J3a1mgp4v6mX/lf2q/gmzEgmzEhG7GhW7HhnDJh3DKiHHMhnDJiHHMiHHMi3TRjXXTjnbUi3TRhnDJhG7GhW7Hh3DKiXLOjHXSjXbUi3TQi3PQjHXSjHTSjnbVkHfXkHjYpor4knrbfmm9jXbUjXXTjXXThW7Hf2q/pYr4por5h3DKinPPi3TQi3TQj3fWcF6peGSznIHpk3rch3DLiHHMiHHMiHHMiXLOiXLOi3PQi3PQi3PQinPPi3TRjXXTj3fWkXnajnbVi3TRiXLOiHHNiXLOjHTSjnbUjnbUmX/llXzgjnbUkHjYkXjZlXzgmH7km4HomoDmlXzgjnbVj3fXk3rck3rcXE2LkHjYm4Hpj3fWkHfXk3rcknrbkHjYlXzflHvdjXbUjnbVj3fXj3fWj3fWkHfXj3fWk3vdkHjYkHjYkXjZkXnakXnaknrbk3rck3vdk3rckXjZkHjXj3fXkHjYkXnaknrbk3rclXzglXzflHvdlHvelHveoIXvo4j1lHvenoTtpIj2b1ymfGe6moDnoYbxp4v6oofym4Hpl37jmH7kpor4nILqlXzflXzflXzflXzflHvelHvelHvelHvelHveln3hhm/Il37im4Hol33il37jl37jmH/kmH/kmH/kl33ilXzglXzglXzfln3hln3hl37il37jl33il37jmH7jmH/kmYDmmX/lnILqm4HpnILqnoPtmX/lmH/km4HomoDnnILqnoPtoYbxp4v6oYbypor5oYbxm4HpnILqnILqn4TunYPrm4HpnILqnILpm4HonoPsgmzDnoTtp4v6nYPrnoPtnoTtn4Tun4Tun4TunoTtnYPrnYLrnILqnILqnILqnILqnILqnILqnILqnYPrnYPsnoPsn4TunoTtn4Tun4TunoTtn4Tun4Tun4TuoIXvoYbxo4j1por4oofzp4v6por5por5por5pYn3pYr4por5pYn3o4j1por5pYn3pYn3nIHpXk6NhG7Gpor5oofzpIj2pIn2pYn3pYn3pYn3pYn3pIn2pIn2pIj2o4j1o4j0o4f0o4f0o4f0o4f0o4j0o4j0pIj1o4j1pIj2pIj2pIj2pIj2pIj2pIn2pYn3pYn3por5p4v6p4v6pIj1por5p4v6oIXwg23Fp4v6p4v6p4v6p4v6p4v6p4v6por5por5o4f0W0uIW0yIp4v6por4p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6por5p4v6por5por5por5p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6pYn3nYPspor5p4v6p4v6p4v6p4v6p4v6p4v6por4p4v6oIXvknrbp4v6por5p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6por5p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6por5por4p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6p4v6"}],"fps":10,"config":{"background":"dark","fontSize":11,"mouseMode":"push","hoverStrength":35,"areaSize":300,"spread":1.1,"animation":"beam-sweep","sourceAspect":1.333333}};

// --- Simplex Noise ---
const SIMPLEX_NOISE = (_x: number, _y: number) => 0;

// --- Constants ---
const STIFFNESS = 0.08;
const DAMPING = 0.85;
const SETTLE_THRESHOLD = 0.01;

// --- Helpers ---

function decodeColors(base64: string, rows: number, cols: number): number[][][] {
  const bin = atob(base64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  const result: number[][][] = new Array(rows);
  for (let r = 0; r < rows; r++) {
    result[r] = new Array(cols);
    for (let c = 0; c < cols; c++) {
      const idx = (r * cols + c) * 3;
      result[r][c] = [arr[idx] || 0, arr[idx + 1] || 0, arr[idx + 2] || 0];
    }
  }
  return result;
}

function parseFrame(frame: { chars: string; colors: string }, rows: number, cols: number) {
  const charRows = frame.chars.split('\n');
  const chars: string[][] = new Array(rows);
  for (let r = 0; r < rows; r++) {
    const line = charRows[r] || '';
    chars[r] = new Array(cols);
    for (let c = 0; c < cols; c++) {
      chars[r][c] = c < line.length ? line[c] : ' ';
    }
  }
  const colors = decodeColors(frame.colors, rows, cols);
  return { chars, colors, _opacity: null as Float32Array | null, _colorMod: null as Float32Array | null, _origChars: null as string[][] | null };
}

type ParsedFrame = ReturnType<typeof parseFrame>;

// --- Animation Presets ---

const GLITCH_CHARS = ['\u2588','\u2593','\u2592','\u2591','#','@','%','&','*'];

type AnimStates = { x: Float32Array; y: Float32Array; vx: Float32Array; vy: Float32Array };
type AnimFrame = { chars: string[][]; colors: number[][][]; _opacity: Float32Array | null; _colorMod: Float32Array | null; _origChars: string[][] | null };

const ANIMATION_PRESETS: Record<string, (s: AnimStates, rows: number, cols: number, cw: number, ch: number, t: number, f: AnimFrame) => void> = {
  'noise-field': (states, rows, cols, _cw, _ch, time) => {
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      states.x[idx] += SIMPLEX_NOISE(c*0.05, r*0.05+time*0.5) * 3;
      states.y[idx] += SIMPLEX_NOISE(c*0.05+100, r*0.05+time*0.5+100) * 3;
    }
  },
  'intervals': (_states, rows, cols, _cw, _ch, time, frame) => {
    if (!frame._opacity) frame._opacity = new Float32Array(rows * cols);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      frame._opacity[r*cols+c] = 0.3 + 0.7*(0.5+0.5*Math.sin(c*0.1+r*0.05+time*2.0));
    }
  },
  'beam-sweep': (_states, rows, cols, _cw, _ch, time, frame) => {
    const beamWidth = Math.max(3, Math.floor(cols*0.05));
    const beamCenter = ((time%3)/3) * cols;
    if (!frame._colorMod) frame._colorMod = new Float32Array(rows*cols);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const dist = Math.abs(c-beamCenter);
      frame._colorMod[r*cols+c] = dist < beamWidth ? 1.0+0.5*(1-dist/beamWidth) : 1.0;
    }
  },
  'glitch': (states, rows, cols, charW, _ch, _time, frame) => {
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (frame.chars[r][c]===' ') continue;
      if (Math.random()<0.002) {
        if (!frame._origChars) frame._origChars = frame.chars.map(row => row.slice());
        frame.chars[r][c] = GLITCH_CHARS[Math.floor(Math.random()*GLITCH_CHARS.length)];
      }
    }
    for (let r = 0; r < rows; r++) if (Math.random()<0.01) {
      const shift = (Math.floor(Math.random()*5)-2) || 1;
      for (let c = 0; c < cols; c++) states.x[r*cols+c] += shift*charW*0.5;
    }
  },
  'crt': (_states, rows, cols, _cw, _ch, _time, frame) => {
    if (!frame._colorMod) frame._colorMod = new Float32Array(rows*cols);
    const cR = rows*0.5, cC = cols*0.5;
    for (let r = 0; r < rows; r++) {
      const scanline = r%2===0 ? 1.0 : 0.7;
      for (let c = 0; c < cols; c++) {
        const dr=(r-cR)/cR, dc=(c-cC)/cC;
        frame._colorMod[r*cols+c] = scanline * (1.0-0.2*(dr*dr+dc*dc));
        if (c>0 && c<cols-1) {
          const rgb=frame.colors[r][c], rL=frame.colors[r][c-1], bR=frame.colors[r][c+1];
          rgb[0]=Math.min(255,Math.floor(rgb[0]*0.7+rL[0]*0.3));
          rgb[2]=Math.min(255,Math.floor(rgb[2]*0.7+bR[2]*0.3));
        }
      }
    }
  },
};


// --- Component ---

export function AsciiArt({
  width = '100%',
  height = 'auto',
  className,
  style,
  interactive = true,
  mouseMode,
  hoverStrength,
  areaSize,
  spread,
  animation,
  onReady,
}: AsciiArtProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const runningRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const config = {
      ...ASCII_DATA.config,
      ...(mouseMode !== undefined && { mouseMode }),
      ...(hoverStrength !== undefined && { hoverStrength }),
      ...(areaSize !== undefined && { areaSize }),
      ...(spread !== undefined && { spread }),
      ...(animation !== undefined && { animation }),
    };

    const fontSize = config.fontSize || 14;
    const font = fontSize + 'px monospace';
    ctx.font = font;
    ctx.textBaseline = 'top';

    const metrics = ctx.measureText('M');
    const charW = metrics.width;
    let charH = (metrics.actualBoundingBoxAscent || fontSize * 0.8) +
                (metrics.actualBoundingBoxDescent || fontSize * 0.2);
    charH = Math.ceil(charH * 1.1);

    const { rows, cols } = ASCII_DATA;
    const parsedFrames: ParsedFrame[] = ASCII_DATA.frames.map(
      (f: { chars: string; colors: string }) => parseFrame(f, rows, cols)
    );

    // Physics state
    const count = rows * cols;
    const states = {
      x: new Float32Array(count),
      y: new Float32Array(count),
      vx: new Float32Array(count),
      vy: new Float32Array(count),
    };

    // Mouse state
    let mouseX = -9999, mouseY = -9999, mouseActive = false;
    let frameIndex = 0;
    const startTime = performance.now();

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    // Canvas sizing
    const naturalW = cols * charW;
    const naturalH = rows * charH;

    function resize() {
      const container = canvas!.parentElement;
      if (!container) return;
      const containerW = container.clientWidth;
      const scale = Math.min(1, containerW / naturalW);
      canvas!.width = Math.floor(naturalW * scale);
      canvas!.height = Math.floor(naturalH * scale);
      return scale;
    }

    let scale = resize() || 1;

    // Look up animation
    const animName = config.animation || 'none';
    type AnimFn = (typeof ANIMATION_PRESETS)[string];
    let animFn: AnimFn | null = null;
    if (animName !== 'none') {
      animFn = ANIMATION_PRESETS[animName] ?? null;
    }

    const isStatic = parsedFrames.length <= 1 && !animFn;

    function getBgColor() {
      const bg = config.background || 'dark';
      if (bg === 'transparent') return null;
      if (bg === 'light') return '#ffffff';
      return '#000000';
    }

    function renderFrame(frame: ParsedFrame) {
      if (!ctx || !canvas) return;
      const cW = charW * scale;
      const cH = charH * scale;

      const bgColor = getBgColor();
      if (bgColor) {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      ctx.font = Math.floor(fontSize * scale) + 'px monospace';
      ctx.textBaseline = 'top';

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const ch = frame.chars[r][c];
          if (ch === ' ') continue;
          const rgb = frame.colors[r][c];
          const idx = r * cols + c;
          let bx = c * cW + states.x[idx] * scale;
          let by = r * cH + states.y[idx] * scale;

          let cr = rgb[0], cg = rgb[1], cb = rgb[2];
          if (frame._colorMod) {
            const mod = frame._colorMod[idx];
            cr = Math.min(255, Math.floor(cr * mod));
            cg = Math.min(255, Math.floor(cg * mod));
            cb = Math.min(255, Math.floor(cb * mod));
          }
          if (frame._opacity) ctx.globalAlpha = frame._opacity[idx];

          ctx.fillStyle = `rgb(${cr},${cg},${cb})`;
          ctx.fillText(ch, bx, by);
        }
      }
      if (frame._opacity) ctx.globalAlpha = 1.0;
    }

    function updatePhysics() {
      const cfgAreaSize = config.areaSize || 268;
      const cfgStrength = ((config.hoverStrength || 22) / 100) * 3.0;
      const mode = config.mouseMode || 'push';
      const dir = mode === 'push' ? -1 : 1;
      const areaSizeSq = cfgAreaSize * cfgAreaSize;
      let anyMoving = false;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          if (mouseActive && interactive) {
            const homeX = c * charW + charW * 0.5;
            const homeY = r * charH + charH * 0.5;
            const dx = mouseX - homeX;
            const dy = mouseY - homeY;
            const distSq = dx * dx + dy * dy;
            if (distSq < areaSizeSq && distSq > 0.01) {
              const dist = Math.sqrt(distSq);
              const force = (1 - dist / cfgAreaSize) * cfgStrength;
              const invDist = 1 / dist;
              states.vx[idx] += dx * invDist * force * dir;
              states.vy[idx] += dy * invDist * force * dir;
            }
          }
          states.vx[idx] += -states.x[idx] * STIFFNESS;
          states.vy[idx] += -states.y[idx] * STIFFNESS;
          states.vx[idx] *= DAMPING;
          states.vy[idx] *= DAMPING;
          states.x[idx] += states.vx[idx];
          states.y[idx] += states.vy[idx];
          if (Math.abs(states.x[idx]) > SETTLE_THRESHOLD ||
              Math.abs(states.y[idx]) > SETTLE_THRESHOLD) {
            anyMoving = true;
          }
        }
      }
      return anyMoving;
    }

    // Event handlers
    function getPos(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      const sx = canvas!.width / rect.width;
      const sy = canvas!.height / rect.height;
      return { x: (e.clientX - rect.left) * sx / scale, y: (e.clientY - rect.top) * sy / scale };
    }

    function onMouseMove(e: MouseEvent) {
      const pos = getPos(e);
      mouseX = pos.x; mouseY = pos.y;
      mouseActive = true;
    }
    function onMouseLeave() { mouseActive = false; }
    function onTouchMove(e: TouchEvent) {
      e.preventDefault();
      const t = e.touches[0];
      const rect = canvas!.getBoundingClientRect();
      mouseX = (t.clientX - rect.left) * (canvas!.width / rect.width) / scale;
      mouseY = (t.clientY - rect.top) * (canvas!.height / rect.height) / scale;
      mouseActive = true;
    }
    function onTouchEnd() { mouseActive = false; }

    if (interactive) {
      canvas.addEventListener('mousemove', onMouseMove);
      canvas.addEventListener('mouseleave', onMouseLeave);
      canvas.addEventListener('touchmove', onTouchMove, { passive: false });
      canvas.addEventListener('touchend', onTouchEnd);
    }

    // Resize observer
    const ro = new ResizeObserver(() => {
      scale = resize() || 1;
    });
    ro.observe(canvas.parentElement!);

    runningRef.current = true;

    if (isStatic && !interactive) {
      renderFrame(parsedFrames[0]);
      onReady?.();
    } else {
      const frameDuration = 1000 / (ASCII_DATA.fps || 10);
      let lastFrameTime = 0;

      function loop(timestamp: number) {
        if (!runningRef.current) return;

        if (parsedFrames.length > 1) {
          if (timestamp - lastFrameTime >= frameDuration) {
            frameIndex = (frameIndex + 1) % parsedFrames.length;
            lastFrameTime = timestamp;
          }
        }

        if (!reducedMotion) {
          updatePhysics();
          if (animFn) {
            const elapsed = (timestamp - startTime) / 1000;
            const cf = parsedFrames[frameIndex];
            if (cf._origChars) {
              for (let r = 0; r < rows; r++)
                for (let c = 0; c < cols; c++)
                  cf.chars[r][c] = cf._origChars[r][c];
            }
            animFn(states, rows, cols, charW, charH, elapsed, cf);
          }
        }

        renderFrame(parsedFrames[frameIndex]);
        animRef.current = requestAnimationFrame(loop);
      }

      animRef.current = requestAnimationFrame(loop);
      onReady?.();
    }

    return () => {
      runningRef.current = false;
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
      if (interactive) {
        canvas.removeEventListener('mousemove', onMouseMove);
        canvas.removeEventListener('mouseleave', onMouseLeave);
        canvas.removeEventListener('touchmove', onTouchMove);
        canvas.removeEventListener('touchend', onTouchEnd);
      }
    };
  }, []);

  const containerStyle: React.CSSProperties = {
    width,
    height: height === 'auto' ? undefined : height,
    ...style,
  };

  return (
    <div className={className} style={containerStyle}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Interactive ASCII art"
        style={{ display: 'block', maxWidth: '100%' }}
      />
    </div>
  );
}
