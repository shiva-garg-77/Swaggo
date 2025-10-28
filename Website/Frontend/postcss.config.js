module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {
      // Use browserslist configuration for autoprefixer
      overrideBrowserslist: [
        '> 1%',
        'last 2 versions',
        'not dead',
        'not ie <= 11',
        'not op_mini all'
      ]
    },
  },
}