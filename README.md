# Vue 3 + TypeScript + Rollup + Bootstrap 5 + LiveReload Template

This repo contains a template to create a front-end application using Vue 3 + TypeScript with Rollup bundler and Bootstrap 5 Framework. Also have Livereaload feature!

## Before you need

- git (on windows, [git for windows](https://git-scm.com/download/win) is recommended)
- node.js: available for all major platforms [here](https://nodejs.org/en/download/) (the LTS version is recommended)

A good code editor is also recommended and this repo is designed around [Visual Studio Code](https://code.visualstudio.com/)

I'm using ESLint for VS Code. If you don't want use ESLint rules, just delete `.eslintrc.json`. You can change rules whatever you want. If you want use, you must add lines below to VS Code `settings.json`

```
"eslint.validate": [
    "javascript",
    "typescript"
]
```

## **Installation**

Note that if you have cloned this template repo via GitHub, then you'll need to change the URLs below to match _your_ repo's name:

```bash
git clone https://github.com/ebolax/vue3-typescript-rollup-bootstrap5
cd vue3-typescript-rollup-bootstrap5
npm install

# or
npx degit "ebolax/vue3-typescript-rollup-bootstrap5" myapp
cd myapp
npm install
```

## **Build and Run**

The `./public/index.html` file contains a `<script src="index.js">` tag, which means we need to create `public/index.js`. The npm command `npm run build` tells ESBuild to create this bundle, starting with `./src/main.ts` and including all its dependencies.

    npm run dev

Builds the application to `public/index.js` file and serve `./public/index.html` file on `http://localhost:5000`

Watch ./src and ./public folders to serve the files locally for changes and live reload browser (you need livereload plugin for your browser).

    npm run build

Builds the application and minify to `public/index.js`. You must do it before you publish your web application.

    npm run start

It's just serve `./public` folder to test your web application.