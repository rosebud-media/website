document.addEventListener("DOMContentLoaded", () => {
  // Parse URL parameters for auto-filtering and custom branding
  const urlParams = new URLSearchParams(window.location.search);
  const authorParam = urlParams.get("author");
  const brandParam = urlParams.get("brand");

  // If a brand is specified, dynamically load its custom CSS
  if (brandParam) {
    const customLink = document.createElement("link");
    customLink.rel = "stylesheet";
    customLink.href = `custom-${brandParam}.css`;
    document.head.appendChild(customLink);
  }

  const articlesList = document.getElementById("articles-list");
  const tagSearchInput = document.getElementById("tagSearch");
  const authorSearchInput = document.getElementById("authorSearch");
  const tagCloudContainer = document.getElementById("tag-cloud");
  const authorsListContainer = document.getElementById("authors-list");

  let allArticles = [];

  // If an author parameter is provided, pre-fill the author filter input
  if (authorParam) {
    authorSearchInput.value = authorParam;
  }

  // Fetch articles from the JSON file
  fetch("articles.json")
    .then(response => response.json())
    .then(articles => {
      allArticles = articles;

      // Render the articles
      renderArticles(allArticles);

      // Generate the tag cloud
      generateTagCloud(allArticles);

      // Generate the author list with post counts
      generateAuthorList(allArticles);

      // Apply filtering if URL parameters are present
      filterArticles();
    })
    .catch(err => {
      console.error("Failed to load articles.json:", err);
      if (articlesList) {
        articlesList.innerHTML = "<p>Error loading articles. Please try again later.</p>";
      }
    });

  // Listen for input changes on filter controls
  if (tagSearchInput) {
    tagSearchInput.addEventListener("input", filterArticles);
  }
  if (authorSearchInput) {
    authorSearchInput.addEventListener("input", filterArticles);
  }

  // Filter articles by tag and author
  function filterArticles() {
    const tagSearchValue = tagSearchInput.value.trim().toLowerCase();
    const authorSearchValue = authorSearchInput.value.trim().toLowerCase();

    const filtered = allArticles.filter(article => {
      let tagMatch = true;
      let authorMatch = true;

      // Check tag match
      if (tagSearchValue) {
        if (article.tags && article.tags.length > 0) {
          tagMatch = article.tags.some(tag => tag.toLowerCase().includes(tagSearchValue));
        } else {
          tagMatch = false;
        }
      }

      // Check author match
      if (authorSearchValue) {
        authorMatch = article.author.toLowerCase().includes(authorSearchValue);
      }

      return tagMatch && authorMatch;
    });
    renderArticles(filtered);
  }

  // Render articles on the page
  function renderArticles(articles) {
    if (!articlesList) return;
    articlesList.innerHTML = "";

    articles.forEach(article => {
      const articleDiv = document.createElement("div");
      articleDiv.classList.add("article-item");
      // Optionally store the author in data-author if you want the 1-second approach
      // or other logic to read it from the DOM. But no longer needed if we unify logic here.
      // articleDiv.setAttribute("data-author", article.author);

      // Title
      const titleEl = document.createElement("h3");
      titleEl.textContent = article.title;
      articleDiv.appendChild(titleEl);

      // Summary
      const summaryEl = document.createElement("p");
      summaryEl.textContent = article.summary;
      articleDiv.appendChild(summaryEl);

      // Metadata (author and date)
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

      // Tags display
      if (article.tags && article.tags.length > 0) {
        const tagsEl = document.createElement("p");
        tagsEl.textContent = "Tags: " + article.tags.join(", ");
        articleDiv.appendChild(tagsEl);
      }

      // Link to view on IPFS Gateway
      if (article.cid) {
        const linkEl = document.createElement("a");
        linkEl.href = `https://ipfs.io/ipfs/${article.cid}`;
        linkEl.target = "_blank";
        linkEl.textContent = "Read on IPFS Gateway";
        articleDiv.appendChild(linkEl);
      }

      articlesList.appendChild(articleDiv);
    });
  }

  // Generate a tag cloud
  function generateTagCloud(articles) {
    if (!tagCloudContainer) return;

    const tagCounts = {};
    articles.forEach(article => {
      if (article.tags && article.tags.length > 0) {
        article.tags.forEach(tag => {
          const lowerTag = tag.toLowerCase();
          tagCounts[lowerTag] = (tagCounts[lowerTag] || 0) + 1;
        });
      }
    });

    tagCloudContainer.innerHTML = "";
    const sortedTags = Object.keys(tagCounts).sort();

    if (sortedTags.length === 0) return;

    const countsArray = Object.values(tagCounts);
    const minCount = Math.min(...countsArray);
    const maxCount = Math.max(...countsArray);

    function mapRange(value, low1, high1, low2, high2) {
      if (high1 === low1) return (low2 + high2) / 2;
      return low2 + ((value - low1) * (high2 - low2)) / (high1 - low1);
    }

    sortedTags.forEach(tag => {
      const count = tagCounts[tag];
      const fontSize = mapRange(count, minCount, maxCount, 12, 36);

      const tagLink = document.createElement("a");
      tagLink.href = "#";
      tagLink.textContent = tag;
      tagLink.style.fontSize = fontSize + "px";
      tagLink.classList.add("tag-cloud-item");

      // Clicking a tag sets the tag filter
      tagLink.addEventListener("click", (e) => {
        e.preventDefault();
        tagSearchInput.value = tag;
        filterArticles();
      });

      tagCloudContainer.appendChild(tagLink);
      tagCloudContainer.appendChild(document.createTextNode(" "));
    });
  }

  // Generate the author list with post counts + profile links
  function generateAuthorList(articles) {
    if (!authorsListContainer) return;

    // Step 1: Count posts from article data
    const authorCounts = {};
    articles.forEach(article => {
      const authorName = article.author.trim();
      if (!authorCounts[authorName]) {
        authorCounts[authorName] = 0;
      }
      authorCounts[authorName]++;
    });

    // Step 2: Sort authors by post count desc, then name asc
    const sortedAuthors = Object.keys(authorCounts).sort((a, b) => {
      const diff = authorCounts[b] - authorCounts[a];
      if (diff !== 0) return diff;
      return a.localeCompare(b);
    });

    authorsListContainer.innerHTML = "";

    // Step 3: Fetch bloggers.json to see who has a profile
    fetch("bloggers.json")
      .then(response => response.json())
      .then(bloggers => {
        // For each author from the articles
        sortedAuthors.forEach(authorName => {
          const postCount = authorCounts[authorName];
          const container = document.createElement("div");
          container.classList.add("blogger-entry");

          // Filter link
          const filterLink = document.createElement("a");
          filterLink.href = "#";
          filterLink.textContent = `${authorName} (${postCount})`;
          filterLink.classList.add("filter-blogger");
          filterLink.addEventListener("click", e => {
            e.preventDefault();
            authorSearchInput.value = authorName;
            filterArticles();
          });
          container.appendChild(filterLink);

          // If this author exists in bloggers.json, add a [Profile] link
          if (bloggers[authorName]) {
            const profileLink = document.createElement("a");
            profileLink.href = "bloggers.html?username=" + encodeURIComponent(authorName);
            profileLink.textContent = " [Profile]";
            profileLink.target = "_blank";
            profileLink.classList.add("blogger-profile-link");
            container.appendChild(profileLink);
          }

          authorsListContainer.appendChild(container);
        });
      })
      .catch(err => console.error("Failed to load bloggers.json for profiles:", err));
  }
});
