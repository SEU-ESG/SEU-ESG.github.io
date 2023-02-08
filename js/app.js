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
  let startPage = currentPage - 2
  let endPage = currentPage + 2
  if (startPage <= 0) {
    endPage -= (startPage - 1)
    startPage = 1
  }
  if (endPage > totalPage) {
    endPage = totalPage
  }
  if (startPage > 1) {
    pagination.push(1)
    if (startPage > 2) {
      pagination.push('...')
    }
  }
  for (let i = startPage; i <= endPage; i++) {
    pagination.push(i)
  }
  if (endPage < totalPage) {
    if (endPage < totalPage - 1) {
      pagination.push('...')
    }
    pagination.push(totalPage)
  }
  return pagination
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
        }
      },
      methods: {
        renderPagination: renderPagination,
      }
    })
    app.mount('#app')
  })
