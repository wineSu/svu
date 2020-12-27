import typescript from 'rollup-plugin-typescript2'

export default {
  input: 'src/index.ts',
  output: [
    { file: 'dist/vue.d.ts', format: 'esm', exports: 'named' },
    {
      file: 'dist/vue.esm.js',
      format: 'esm',
      sourcemap: true
    }, {
      file: 'dist/vue.js',
      format: 'umd',
      sourcemap: true,
      name: 'Vue'
    }
  ],
  plugins: [
    typescript({
      tsconfig: 'tsconfig.json',
      removeComments: true,
      useTsconfigDeclarationDir: true,
    }),
  ]
}
