const ejs = require('ejs');
const minify = require('html-minifier').minify;
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const searchPaper = require('./search-paper');

function render(md) {
  return marked(md);
}

// Read the configuration file
const global = yaml.load(fs.readFileSync(path.join(__dirname, 'configs/global.yaml'), 'utf8'));
const schedules = yaml.load(fs.readFileSync(path.join(__dirname, 'configs/schedules.yaml'), 'utf8'));

// Read the blog posts from /blog, sort by date
const blogs = fs.readdirSync(path.join(__dirname, 'blog'))
  .map(file => {
    const content = fs.readFileSync(path.join(__dirname, 'blog', file), 'utf8');
    const [_, frontMatter, ...rest] = content.split('---');
    const { title, date, author } = yaml.load(frontMatter);
    const html = render(rest.join('\n'));
    return { title, date, author, html, id: file.replace('.md', '') };
  })
  .sort((a, b) => new Date(b.date) - new Date(a.date))
  .map((blog, i) => ({ ...blog, date: new Date(blog.date).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }) }));

// For each schedule, search for the paper doi
(async () => {
  for (let i = 0; i < schedules.length; i++) {
    const schedule = schedules[i];
    const { title } = schedule;
    const dblp = await searchPaper(title);
    if (dblp) {
      console.log(`[${i + 1}/${schedules.length}] ${title} => ${dblp.url}`);
      schedule.dblp = dblp;
    } else {
      console.error(`[${i + 1}/${schedules.length}] ${title} => Not found`);
    }
  }
  return schedules;
})().then(schedules => {
  // Write schedules to /schedules.json
  fs.writeFileSync(path.join(__dirname, 'schedules.js'), `var schedules = ${JSON.stringify(schedules)}`);

  // Render global.upcoming
  latest = schedules[0];
  global.upcoming = `${latest.presenter} will present a/an ${latest.conf} paper on ${latest.time}, ${latest.date} at ${latest.location}.`;

  // Render index.ejs
  const index = minify(ejs.render(fs.readFileSync(path.join(__dirname, 'views', 'index.ejs'), 'utf8'), { global, blogs, schedules }), {
    collapseWhitespace: true,
    removeComments: true,
    minifyJS: true,
    minifyCSS: true
  });

  // Render blog.ejs
  const blog = minify(ejs.render(fs.readFileSync(path.join(__dirname, 'views', 'blog.ejs'), 'utf8'), { global, blogs }), {
    collapseWhitespace: true,
    removeComments: true,
    minifyJS: true,
    minifyCSS: true
  });

  // Write the rendered HTML to index.html
  fs.writeFileSync(path.join(__dirname, 'index.html'), index);
  fs.writeFileSync(path.join(__dirname, 'blog.html'), blog);
});
