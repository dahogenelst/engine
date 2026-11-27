const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: {
    editor:    './app/javascript/src/locomotive/editor.es6',   // the section editor (page content)
    rich_text: './app/javascript/src/locomotive/rich_text.es6' // the rich text inputs of the back-office
  },
  output: {
    path: path.resolve(__dirname, '..', '..', 'app', 'assets'),
    filename: 'javascripts/locomotive/[name].js'
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|es6)$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader'
      },
      {
        test: /\.scss$/,
        use: [ // extracted to editor.css, linked by the page
          MiniCssExtractPlugin.loader,
          { loader: 'css-loader', options: { sourceMap: false } }, // no editor.css.map next to the asset
          'postcss-loader',
          { loader: 'sass-loader', options: { sassOptions: { quietDeps: true } } } // deprecations in node_modules are not ours to fix
        ]
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({ filename: 'stylesheets/locomotive/editor.css' })
  ]
};
