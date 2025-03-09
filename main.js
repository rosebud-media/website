// main.js
document.addEventListener("DOMContentLoaded", () => {
    const articlesList = document.getElementById("articles-list");
    const tagSearchInput = document.getElementById("tagSearch");
  
    let allArticles = [];
  
    // Fetch articles.json
    fetch("articles.json")
      .then((response) => response.json())
      .then((articles) => {
        allArticles = articles;
        renderArticles(articles);
      })
      .catch((err) => {
        console.error("Failed to load articles.json:", err);
        if (articlesList) {
          articlesList.innerHTML = "<p>Error loading articles. Please try again later.</p>";
        }
      });
  
    // Listen for input changes on the search box
    if (tagSearchInput) {
      tagSearchInput.addEventListener("input", (e) => {
        const searchValue = e.target.value.trim().toLowerCase();
        filterByTag(searchValue);
      });
    }
  
    // Function to render a given array of articles
    function renderArticles(articles) {
      if (!articlesList) return;
      articlesList.innerHTML = "";
  
      articles.forEach((article) => {
        const articleDiv = document.createElement("div");
        articleDiv.classList.add("article-item");
  
        // Title
        const titleEl = document.createElement("h3");
        titleEl.textContent = article.title;
        articleDiv.appendChild(titleEl);
  
        // Summary
        const summaryEl = document.createElement("p");
        summaryEl.textContent = article.summary;
        articleDiv.appendChild(summaryEl);
  
        // Metadata
        const metaEl = document.createElement("p");
        metaEl.classList.add("article-meta");
        metaEl.textContent = `Author: ${article.author} | Approved: ${article.date_approved}`;
        articleDiv.appendChild(metaEl);
  
        // Tags
        if (article.tags && article.tags.length > 0) {
          const tagsEl = document.createElement("p");
          tagsEl.textContent = "Tags: " + article.tags.join(", ");
          articleDiv.appendChild(tagsEl);
        }
  
        // Link to IPFS
        const linkEl = document.createElement("a");
        linkEl.href = `https://ipfs.io/ipfs/${article.cid}`;
        linkEl.target = "_blank";
        linkEl.textContent = "Read on IPFS Gateway";
        articleDiv.appendChild(linkEl);
  
        articlesList.appendChild(articleDiv);
      });
    }
  
    // Filter articles by tag
    function filterByTag(searchValue) {
      // If search is empty, display all
      if (!searchValue) {
        renderArticles(allArticles);
        return;
      }
  
      // Filter articles whose tags contain the searchValue
      // or you could also filter by article.title or author
      const filtered = allArticles.filter((article) => {
        if (!article.tags) return false;
        // check if any tag includes the search string
        return article.tags.some((tag) => tag.toLowerCase().includes(searchValue));
      });
  
      renderArticles(filtered);
    }
  });
  