const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')
const { exit } = require('process')

const schedules = yaml.load(
  fs.readFileSync(path.join(__dirname, 'configs/schedules.yaml'), 'utf8')
)

function fileExistsWithCaseSensitive(filepath) {
  try {
    const dir = path.dirname(filepath)
    const fileToCheck = path.basename(filepath)
    const files = fs.readdirSync(dir)
    return files.includes(fileToCheck)
  } catch (e) {
    return false
  }
}

schedules
  .map((schedule) => schedule.links)
  .forEach((link) => {
    link.forEach((l) => {
      if (l.title === 'Slides' && l.url.startsWith('/')) {
        const file = path.join(__dirname, l.url)
        if (!fileExistsWithCaseSensitive(file)) {
          console.error(`Slide not found: ${file}`)
          exit(1)
        }
      }
    })
  })
