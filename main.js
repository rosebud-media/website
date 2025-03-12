document.addEventListener("DOMContentLoaded", () => {
  const articlesList = document.getElementById("articles-list");
  const tagSearchInput = document.getElementById("tagSearch");
  const authorSearchInput = document.getElementById("authorSearch");

  let allArticles = [];

  // Fetch the JSON file containing article data
  fetch("articles.json")
    .then(response => response.json())
    .then(articles => {
      allArticles = articles;
      renderArticles(articles);
    })
    .catch(err => {
      console.error("Failed to load articles.json:", err);
      if (articlesList) {
        articlesList.innerHTML = "<p>Error loading articles. Please try again later.</p>";
      }
    });

  // Listen for changes in both search input fields
  if (tagSearchInput) {
    tagSearchInput.addEventListener("input", filterArticles);
  }
  if (authorSearchInput) {
    authorSearchInput.addEventListener("input", filterArticles);
  }

  // Function to filter articles based on tag and author search values
  function filterArticles() {
    const tagSearchValue = tagSearchInput.value.trim().toLowerCase();
    const authorSearchValue = authorSearchInput.value.trim().toLowerCase();

    const filtered = allArticles.filter(article => {
      let tagMatch = true;
      let authorMatch = true;

      if (tagSearchValue) {
        // If no tags exist, mark as false
        if (article.tags && article.tags.length > 0) {
          tagMatch = article.tags.some(tag => tag.toLowerCase().includes(tagSearchValue));
        } else {
          tagMatch = false;
        }
      }
      if (authorSearchValue) {
        authorMatch = article.author.toLowerCase().includes(authorSearchValue);
      }
      return tagMatch && authorMatch;
    });
    renderArticles(filtered);
  }

  // Function to render a list of articles
  function renderArticles(articles) {
    if (!articlesList) return;
    articlesList.innerHTML = "";

    articles.forEach(article => {
      const articleDiv = document.createElement("div");
      articleDiv.classList.add("article-item");

      // Article title
      const titleEl = document.createElement("h3");
      titleEl.textContent = article.title;
      articleDiv.appendChild(titleEl);

      // Article summary
      const summaryEl = document.createElement("p");
      summaryEl.textContent = article.summary;
      articleDiv.appendChild(summaryEl);

      // Article metadata: author and approval date
      const metaEl = document.createElement("p");
      metaEl.classList.add("article-meta");
      metaEl.textContent = `Author: ${article.author} | Approved: ${article.date_approved}`;
      articleDiv.appendChild(metaEl);

      // Mature content indicator
      if (article.mature) {
        const matureEl = document.createElement("span");
        matureEl.textContent = "Mature Content";
        matureEl.classList.add("mature-indicator");
        articleDiv.appendChild(matureEl);
      }

      // Tags list
      if (article.tags && article.tags.length > 0) {
        const tagsEl = document.createElement("p");
        tagsEl.textContent = "Tags: " + article.tags.join(", ");
        articleDiv.appendChild(tagsEl);
      }

      // Link to view the article on an IPFS gateway
      const linkEl = document.createElement("a");
      linkEl.href = `https://ipfs.io/ipfs/${article.cid}`;
      linkEl.target = "_blank";
      linkEl.textContent = "Read on IPFS Gateway";
      articleDiv.appendChild(linkEl);

      articlesList.appendChild(articleDiv);
    });
  }
});
