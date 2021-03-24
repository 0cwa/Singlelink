// Require the framework and instantiate it
const fastify = require('fastify')({ logger: false })

// Include .env as ENV variables via process.env
require('dotenv').config()

// Include HTTP Client, Axios
const axios = require('axios');

// Make console logging output pretty
const chalk = require('chalk');

// Define port for launch
const port = process.env.PORT ?? 3000;

// Define app name
const app_name = process.env.APP_NAME ?? 'Singlelink';

// Define free signup
const free_signup = process.env.FREE_SIGNUP ?? true;

// Define hostname
const hostname = process.env.HOSTNAME ?? 'api.singlelink.co';

// Define API URL
const api_url = process.env.API_URL ?? 'https://api.singlelink.co';

// Declare site route
fastify.route({
    method: 'GET',
    url: '/u/*',
    handler: async (request, reply) => {
        // Get requested site handle from URL
        const handle = request.url.replace('/u/', '');

        // Log request
        console.log(chalk.cyan.bold(app_name) + ': Request received at /' + handle);
        
        let response;

        try {
            // Fetch site from API
            response = await axios.get(api_url + '/profile/' + handle);
        } catch(err) {
            // Log error
            console.log(chalk.cyan.bold(app_name) + ': Error when processing request');
            console.log(chalk.cyan.bold(app_name) + ': ' + err);
            reply.type('text/html');
            return reply.send(`
                <html>
                    <head>
                        <title>Singlelink web client</title>
                    </head>
                    <body>
                        <div class="w-full h-full flex flex-col items-center justify-center">
                            <h1 class="text-4xl text-gray-900 mb-2 font-extrabold">500 - Server Error</h1>
                            <h3 class="text-lg text-gray-600 mb-4">Oops! Something went wrong. Try again?</h3>
                            <a class="bg-indigo-600 hover:bg-indigo-500 rounded shadow text-white py-3 px-6 text-sm font-medium" href="` + request.url + `">Reload page</a>
                        </div>
                        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.0.4/tailwind.min.css"/>
                        <style>
                            @import url('https://rsms.me/inter/inter.css');
                            html { font-family: 'Inter', sans-serif; }
                            @supports (font-variation-settings: normal) {
                            html { font-family: 'Inter var', sans-serif; }
                            }
                        </style>
                    </body>
                </html>
            `)
        }

        // Define site
        const site = response.data.profile;

        // Define user
        const user = response.data.user;

        // Define theme = response.data.theme;
        const theme = response.data.theme;

        // Define Avatar image
        const imageUrl = site.imageUrl ?? user.avatarUrl ?? 'https://www.gravatar.com/avatar/' + user.emailHash;

        // Defin Link HTML Block
        let linkHtml = '';
        
        // Define links & sort by order
        const links = response.data.links.sort(function (a, b) {
            return a.sortOrder - b.sortOrder;
        });

        // Add link html to html block link-by-link
        for await (let link of links) {
            let subtitleHtml = '';
            if(link.subtitle) subtitleHtml = `<span class="text-sm text-gray-700 sl-link-subtitle mt-1">` + link.subtitle + `</span>`;
            let css = link.customCss ?? '';
            linkHtml+= `
                <a
                    id="sl-item-`+link.id+`"
                    href="` + api_url + '/analytics/link/' + link.id + `"
                    class="w-full"
                    target="_blank"
                >
                    <div
                        class="rounded shadow bg-white p-4 w-full font-medium mb-3 nc-link sl-item  flex items-center justify-center flex-col"
                        style="`+css+`"
                    >
                        <span class="font-medium text-gray-900 sl-label">` + link.label + `</span>` + subtitleHtml + `
                    </div>
                </a>
            `;
        }

        // Define headline HTML
        const headlineHtml = `<h1 class="text-black font-semibold text-2xl sl-headline">` + site.headline ?? user.name + `</h1>`;

        // Define subtitle HTML
        let subtitleHtml = ``;
        if(site.subtitle) subtitleHtml = `<h3 class="text-gray-600 mb-4 sl-subtitle">` + site.subtitle + `</h3>`;

        // Define theme colors html
        let themeColorsHtml = ``;
        if(theme) themeColorsHtml = `
        <style>
            .sl-headline {
                color: ` + theme.colors.text.primary + `;
            }

            .sl-subtitle {
                opacity: .85;
                color: ` + theme.colors.text.primary + `;
            }

            .sl-bg {
                background: ` +theme.colors.fill.primary+ `;
            }

            .sl-item {
                background: ` + theme.colors.fill.secondary+ `;
            }

            .sl-label {
                color: ` + theme.colors.text.secondary+ `;
            }

            .sl-link-subtitle {
                opacity: .85;
                color: ` + theme.colors.text.secondary+ `;
            }
        </style>`;

        // Build watermark string
        let watermarkHtml = '';
        watermarkHtml += `<div id="sl-watermark">`;
        if(theme) {
        watermarkHtml += `
        <p style="color: ` + theme.colors.text.primary + `;" class="mt-4 text-sm">
          Proudly built with ` + app_name + ` 🔗
        </p>`;
        } else {
        watermarkHtml += `
        <p v-else style="color:rgba(0,0,0,1);" class="mt-4 text-sm">
          Proudly built with ` + app_name + ` 🔗
        </p>`;
        }
        if(free_signup) {
            watermarkHtml += `
            <a class="text-indigo-600 hover:underline text-sm" href="https://` + hostname + `/create-account" target="_blank">
                Create your free profile in minutes!
            </a>`;
        }
        watermarkHtml += `<base target="_blank">`;
        watermarkHtml += `</div>`;

        if(site.customCss === null) site.customCss = '';
        if(site.customHtml === null) site.customHtml = '';
        if(theme.customCss === null) theme.customCss = '';
        if(theme.customHtml === null) theme.customHtml = '';

        // Send response content type to text/html
        reply.type('text/html');
        // Send response to client
        return reply.send(`
            <html>
                <head>
                    <title>Singlelink web client</title>
                </head>
                <body>
                    <div class="relative flex min-h-screen w-screen bg-gray-100 justify-center w-full sl-bg">
                        <div
                            id="user-site-view"
                            class="relative flex min-h-screen w-screen bg-gray-100 justify-center w-full sl-bg"
                        >
                            <section class="flex flex-col p-6 pt-8 pb-8 items-center text-center max-w-sm w-full">
                                <img class="nc-avatar mb-2" src="` + imageUrl + `" />
                                ` + headlineHtml + `
                                ` + subtitleHtml + `
                                ` + linkHtml + `
                                <!-- Site html -->
                                <div id="custom-html">
                                ` + site.customHtml + `
                                </div>
                                <!-- Theme html -->
                                <div id="theme-html">
                                ` + theme.customHtml + `
                                </div>
                                <!-- Watermark -->
                                ` + watermarkHtml + `
                                <!-- Tailwind CSS -->
                                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.0.4/tailwind.min.css"/>
                                <!-- Theme style -->
                                <style type="text/css">
                                ` + theme.customCss + `
                                </style>
                                <!-- Personal styles -->
                                <style type="text/css">
                                ` + site.customCss + `
                                </style>
                                <style>
                                    .nc-avatar {
                                        width: 60px;
                                        height: 60px;
                                        border-radius: 1000px;
                                    }
                                    .nc-link {
                                        background-color: #FFF;
                                        padding: 1rem;
                                        margin-bottom: .75rem;
                                        width: 100%;
                                        border-radius: .25rem;
                                        box-shadow: 0 1px 3px 0 rgb(0 0 0 / 10%), 0 1px 2px 0 rgb(0 0 0 / 6%);
                                        font-weight: 500;
                                        cursor: pointer;
                                        transition: transform .15s ease-in-out;
                                    }
                                    .nc-link:hover {
                                        transform: scale(1.02);
                                    }
                                    .nc-link:active {
                                        transform: scale(1);
                                    }
                                    body {
                                        overflow-x: hidden;
                                    }
                                </style>
                                ` + themeColorsHtml + `
                                
                            </section>
                        </div>
                    </div>
                    <style>
                        html, * {
                            font-family: 'Inter',
                            -apple-system,
                            BlinkMacSystemFont,
                            'Segoe UI',
                            Roboto,
                            'Helvetica Neue',
                            Arial,
                            sans-serif;
                            font-size: 16px;
                            line-height: 1.65;
                            word-spacing: 1px;
                            -ms-text-size-adjust: 100%;
                            -webkit-text-size-adjust: 100%;
                            -moz-osx-font-smoothing: grayscale;
                            -webkit-font-smoothing: antialiased;
                            box-sizing: border-box;
                        }

                        h1.sl-headline, h3.sl-subtitle {
                            line-height: 1.65;
                            word-spacing: 1px;
                            -ms-text-size-adjust: 100%;
                            -webkit-text-size-adjust: 100%;
                            -moz-osx-font-smoothing: grayscale;
                            -webkit-font-smoothing: antialiased;
                        }

                        *,
                        *::before,
                        *::after {
                        box-sizing: border-box;
                        margin: 0;
                        }
                    </style>
                </body>
            </html>
        `);
    }
});

// Run the server!
const start = async () => {
  try {
    console.clear();
    console.log(chalk.cyan.bold(app_name) + ': Starting application...')
    await fastify.listen(port)
    console.log(chalk.cyan.bold(app_name) + ': Application listening on port ' + port);
  } catch (err) {
    console.log(chalk.cyan.bold(app_name) + ': Error!');
    console.log(chalk.cyan.bold(app_name) + ': ' + err);
    process.exit(1)
  }
}
start()