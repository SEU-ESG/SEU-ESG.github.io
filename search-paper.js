const axios = require('axios');
const xml2js = require('xml2js');
const fs = require('fs');

function titleMatch(title1, title2) {
    return title1.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === title2.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

async function searchDBLP(title) {
  const baseUrl = 'https://dblp.org/search/publ/api';
  const encodedTitle = encodeURIComponent(title);
  const query = `q=${encodedTitle}&format=xml&h=1`; // h=1 limits to 1 result

  try {
    const response = await axios.get(`${baseUrl}?${query}`);
    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(response.data);

    if (result.result && result.result.hits && result.result.hits.hit) {
      const hit = result.result.hits.hit;
      if (hit.info) {
        return {
          title: hit.info.title,
          url: hit.info.ee || null,
          exactMatch: titleMatch(title, hit.info.title),
        };
      }
    }
    return null;
  } catch (error) {
    console.error('Error in searchDBLP');
    return null;
  }
}

async function searchSemanticScholar(title) {
  const baseUrl = 'https://api.semanticscholar.org/graph/v1';
  const endpoint = '/paper/search';
  const query = `?query=${encodeURIComponent(title)}&limit=1&fields=title,externalIds,url,year,authors,venue,publicationVenue,openAccessPdf`;

  try {
    const response = await axios.get(`${baseUrl}${endpoint}${query}`);
    const paper = response.data.data[0];
    
    if (paper) {
      // Prioritize original URLs in this order: DOI, arXiv, openAccessPdf, or fallback to S2 URL
      let originalUrl = paper.url; // Fallback to Semantic Scholar URL
      if (paper.externalIds && paper.externalIds.DOI) {
        originalUrl = `https://doi.org/${paper.externalIds.DOI}`;
      } else if (paper.externalIds && paper.externalIds.ArXiv) {
        originalUrl = `https://arxiv.org/abs/${paper.externalIds.ArXiv}`;
      } else if (paper.openAccessPdf && paper.openAccessPdf.url) {
        originalUrl = paper.openAccessPdf.url;
      } else if (paper.publicationVenue && paper.publicationVenue.url) {
        originalUrl = paper.publicationVenue.url;
      }

      return {
        title: paper.title,
        url: originalUrl,
        exactMatch: titleMatch(title, paper.title) && !originalUrl.includes('semanticscholar.org') && !originalUrl.includes('byname'),
      };
    }
    return null;
  } catch (error) {
    console.error('Error searching Semantic Scholar');
    return null;
  }
}

async function searchOpenAlex(title) {
  const baseUrl = 'https://api.openalex.org/works';
  const query = `?filter=title.search:${encodeURIComponent(title)}&sort=relevance_score:desc&per-page=1`;

  try {
    const response = await axios.get(`${baseUrl}${query}`, {
      headers: {
        'User-Agent': 'YourAppName/1.0 (mailto:your-email@example.com)'
      }
    });
    const paper = response.data.results[0];
    
    if (paper) {
      // Determine the best URL to use
      let bestUrl = paper.doi || null;
      if (!bestUrl && paper.open_access && paper.open_access.oa_url) {
        bestUrl = paper.open_access.oa_url;
      }
      if (!bestUrl && paper.primary_location && paper.primary_location.landing_page_url) {
        bestUrl = paper.primary_location.landing_page_url;
      }

      return {
        title: paper.title,
        url: bestUrl,
        exactMatch: titleMatch(title, paper.title),
      };
    }
    return null;
  } catch (error) {
    console.error('Error searching OpenAlex');
    return null;
  }
}

async function searchArXiv(title) {
  const baseUrl = 'http://export.arxiv.org/api/query';
  const encodedTitle = encodeURIComponent(title.replace(/[^a-zA-Z0-9]/g, ' ')); // Remove special characters
  const query = `search_query=ti:"${encodedTitle}"&start=0&max_results=1`;

  try {
    const response = await axios.get(`${baseUrl}?${query}`);
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(response.data);

    if (result.feed.entry && result.feed.entry.length > 0) {
      const entry = result.feed.entry[0];
      const arXivId = entry.id[0].split('/abs/')[1];
      return {
        title: entry.title[0],
        url: `https://arxiv.org/abs/${arXivId}`,
      };
    }
    return null;
  } catch (error) {
    console.error('Error in searchArXiv');
    return null;
  }
}

function lookUpCache(title) {
  // dblp-cache.json
  if (fs.existsSync('dblp-cache.json')) {
    const cache = JSON.parse(fs.readFileSync('dblp-cache.json', 'utf8'));
    if (cache[title]) {
      return cache[title];
    }
  }
}

function saveCache(title, result) {
  if (!fs.existsSync('dblp-cache.json')) {
    fs.writeFileSync('dblp-cache.json', '{}');
  }
  const cache = JSON.parse(fs.readFileSync('dblp-cache.json', 'utf8'));
  cache[title] = result;
  fs.writeFileSync('dblp-cache.json', JSON.stringify(cache, null, 2));
}

async function _searchPaper(title) {
  // First, try DBLP
  const dblpResult = await searchDBLP(title);
  if (dblpResult && dblpResult.exactMatch && dblpResult.url) {
    return { source: 'DBLP', url: dblpResult.url };
  }

  // Try OpenAlex
  const openAlexResult = await searchOpenAlex(title);
  if (openAlexResult && openAlexResult.exactMatch && openAlexResult.url) {
    return { source: 'OpenAlex', url: openAlexResult.url };
  }

  // Try Semantic Scholar
  const semanticScholarResult = await searchSemanticScholar(title);
  if (semanticScholarResult && semanticScholarResult.exactMatch && semanticScholarResult.url) {
    return { source: 'Semantic Scholar', url: semanticScholarResult.url };
  }

  // If not found in DBLP or no exact match, try arXiv
  const arXivResult = await searchArXiv(title);
  if (arXivResult && arXivResult.url) {
    return { source: 'arXiv', url: arXivResult.url };
  }

  // If no results from either source
  return null;
}

async function searchPaper(title) {
  // Check cache first
  const cacheResult = lookUpCache(title);
  if (cacheResult) {
    return cacheResult;
  }

  // Search for the paper
  const result = await _searchPaper(title);

  // Save to cache
  saveCache(title, result);

  return result;
}

// // Usage example
// async function main() {
//   const title = "Soter: Guarding Black-box Inference for General Neural Networks at the Edge";
//   try {
//     const result = await searchSemanticScholar(title);
//     if (result) {
//       console.log(`Found paper URL: ${result.url}`);
//     } else {
//       console.log("No DOI found for the given title.");
//     }
//   } catch (error) {
//     console.error('Error in main:', error);
//   }
// }

// main();

module.exports = searchPaper;