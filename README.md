# SEU Edge System Group Website

This repository contains the source code for the official website of the Edge System Group at Southeast University (SEU).

The main purpose of this website is to host the presentation schedules for the reading group of the Edge System Group at SEU. The website is built using Node.js and EJS templating engine, with a custom build process for generating static pages.

## Prerequisites

Before you begin, ensure you have met the following requirements:

- You have installed Node.js (version 12.x or later recommended)
- You have a basic understanding of JavaScript and Node.js

## Getting Started

To install the project, follow these steps:

```bash
git clone https://github.com/SEU-ESG/seu-esg.github.io.git
cd seu-esg.github.io
npm install
```

To use SEU-ESG website, follow these steps:

### Building the website

```bash
npm run build
```

This command will generate static HTML files in the `dist` directory, which can be deployed to a web server.

### Start the development server

To run the website in development mode with a local server:

```bash
npm run dev
```

Note that this command starts a dev server after running the build process. It will serve the files from the `dist` directory at `http://localhost:3000` (check the console output for the exact URL).

### Updating Schedules

To add a new schedule for the reading group:

1. Open the file `configs/schedules.yaml`
2. Edit this file to add or modify schedules
3. Save the file and rebuild the website using `npm run build`

### Adding Presentation Slides

To add presentation slides:

1. Place the slide files in the `slides` directory
2. Reference these slides in your schedule entries in `configs/schedules.yaml`

### Updating Blogs

To add a new blog post:

1. Create a new markdown file in the `blogs` directory
2. Add the necessary metadata to the file
3. Rebuild the website using `npm run build`

### Advanced Configuration

For advanced configurations, refer to `configs/global.yaml`. This file contains global settings for the website.

## Contact

If you want to contact the maintainer of this project, please reach out to @liu-mengyang.

## License

This project is licensed under the MIT License.