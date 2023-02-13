const { createApp } = Vue
const yaml = jsyaml

const CONFIG_URL = '/configs/config.yml'

function slicePages(schedules, perPage) {
  const pages = []
  let page = []
  for (const schedule of schedules) {
    if (page.length === perPage) {
      pages.push(page)
      page = []
    }
    page.push(schedule)
  }
  if (page.length > 0) {
    pages.push(page)
  }
  return pages
}

function renderPagination(currentPage, totalPage) {
  const pagination = []
  let startPage = currentPage
  let endPage = currentPage + 1
  if (startPage <= 0) {
    endPage -= startPage - 1
    startPage = 1
  }
  if (endPage > totalPage) {
    endPage = totalPage
  }
  if (startPage > 1) {
    pagination.push(1)
    if (startPage == 2) {}
    else if (startPage == 3) {
      pagination.push(2)
    } else {
      pagination.push('...')
    }
  }
  for (let i = startPage; i <= endPage; i++) {
    pagination.push(i)
  }
  if (endPage < totalPage) {
    if (endPage == totalPage - 1) {
      pagination.push(totalPage)
    } else if (endPage == totalPage - 2) {
      pagination.push(totalPage - 1)
      pagination.push(totalPage)
    } else {
      pagination.push('...')
      pagination.push(totalPage)
    }
  }
  return pagination
}

function factoryW3Colors(color) {
  return {
    text: 'w3-text-' + color,
    bg: 'w3-' + color,
    border: 'w3-border-' + color,
    hover: 'w3-hover-' + color,
  }
}

fetch(CONFIG_URL)
  .then((response) => response.text())
  .then((data) => {
    const config = yaml.load(data)
    const pages = slicePages(config.schedules, config.layout.schedulesPerPage)
    const app = createApp({
      data() {
        return {
          pages: pages,
          currentPage: 1,
          totalPage: pages.length,
          upcomings: config.upcomings,
          links: config.links,
          primaryColor: factoryW3Colors(config.layout.primaryColor),
          accentColor: factoryW3Colors(config.layout.accentColor),
          global: config.global,
        }
      },
      methods: {
        renderPagination: renderPagination,
      },
    })
    app.mount('#app')
  })
