import typescript from '@rollup/plugin-typescript'
import terser from '@rollup/plugin-terser'

export default {
    input: 'src/index.ts',
    output: {
        dir: 'build',
        format: 'esm',
        entryFileNames: 'voting.mjs'
    },
    plugins: [
        typescript(),
        terser({
            format: {
                comments: 'some',
                beautify: false,
                // ecma: '2022',
            },
            compress: false,
            mangle: false,
            module: true,
        }),
    ]
}
