document.addEventListener("DOMContentLoaded", () => {
  const articlesList = document.getElementById("articles-list");
  const tagSearchInput = document.getElementById("tagSearch");
  const authorSearchInput = document.getElementById("authorSearch");
  const tagCloudContainer = document.getElementById("tag-cloud");
  const authorsListContainer = document.getElementById("authors-list");

  let allArticles = [];

  // Fetch the JSON file containing article data
  fetch("articles.json")
    .then(response => response.json())
    .then(articles => {
      allArticles = articles;

      // Render the initial list of articles
      renderArticles(articles);

      // Build the tag cloud (all tags in the dataset)
      generateTagCloud(articles);

      // Build the author list
      generateAuthorList(articles);
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

  /**
   * Filters articles based on tag and author search values
   */
  function filterArticles() {
    const tagSearchValue = tagSearchInput.value.trim().toLowerCase();
    const authorSearchValue = authorSearchInput.value.trim().toLowerCase();

    const filtered = allArticles.filter(article => {
      let tagMatch = true;
      let authorMatch = true;

      // Tag match check
      if (tagSearchValue) {
        if (article.tags && article.tags.length > 0) {
          tagMatch = article.tags.some(tag => tag.toLowerCase().includes(tagSearchValue));
        } else {
          tagMatch = false;
        }
      }

      // Author match check
      if (authorSearchValue) {
        authorMatch = article.author.toLowerCase().includes(authorSearchValue);
      }

      return tagMatch && authorMatch;
    });

    renderArticles(filtered);
  }

  /**
   * Renders a given array of articles into #articles-list
   */
  function renderArticles(articles) {
    if (!articlesList) return;
    articlesList.innerHTML = "";

    articles.forEach(article => {
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

      // Mature Content Indicator
      if (article.mature) {
        const matureEl = document.createElement("span");
        matureEl.textContent = "Mature Content";
        matureEl.classList.add("mature-indicator");
        articleDiv.appendChild(matureEl);
      }

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

  /**
   * Generates a tag cloud in #tag-cloud, where font size
   * corresponds to how frequently each tag appears.
   * Clicking a tag auto-fills the tag filter and re-filters.
   */
  function generateTagCloud(articles) {
    if (!tagCloudContainer) return;

    // Gather all tags and their counts
    const tagCounts = {};
    articles.forEach(article => {
      if (article.tags && article.tags.length > 0) {
        article.tags.forEach(tag => {
          const lowerTag = tag.toLowerCase();
          if (!tagCounts[lowerTag]) {
            tagCounts[lowerTag] = 0;
          }
          tagCounts[lowerTag]++;
        });
      }
    });

    // If no tags, just clear and return
    if (Object.keys(tagCounts).length === 0) {
      tagCloudContainer.innerHTML = "<p>No tags available.</p>";
      return;
    }

    // Determine min and max frequencies
    const countsArray = Object.values(tagCounts);
    const minCount = Math.min(...countsArray);
    const maxCount = Math.max(...countsArray);

    // Helper function to map a count to a font size
    function mapRange(value, low1, high1, low2, high2) {
      if (high1 === low1) {
        return (low2 + high2) / 2;
      }
      return low2 + ((value - low1) * (high2 - low2)) / (high1 - low1);
    }

    // Clear container
    tagCloudContainer.innerHTML = "";

    // Sort tags alphabetically or by frequency if you like
    const sortedTags = Object.keys(tagCounts).sort();

    // Create a clickable link for each tag
    sortedTags.forEach(tag => {
      const count = tagCounts[tag];
      // Map count to font size between 12px and 36px
      const fontSize = mapRange(count, minCount, maxCount, 12, 36);

      const tagLink = document.createElement("a");
      tagLink.href = "#";
      tagLink.textContent = tag;
      tagLink.style.fontSize = fontSize + "px";
      tagLink.classList.add("tag-cloud-item");

      // On click, set the tagSearchInput and filter
      tagLink.addEventListener("click", (e) => {
        e.preventDefault();
        tagSearchInput.value = tag;
        filterArticles();
      });

      // Add some spacing between tags
      tagCloudContainer.appendChild(tagLink);
      tagCloudContainer.appendChild(document.createTextNode(" "));
    });
  }

  /**
   * Generates an author list in #authors-list, showing each author
   * and how many posts they have. Clicking an author name filters articles.
   */
  function generateAuthorList(articles) {
    if (!authorsListContainer) return;

    // Tally up author frequencies
    const authorCounts = {};
    articles.forEach(article => {
      const lowerAuthor = article.author.toLowerCase();
      if (!authorCounts[lowerAuthor]) {
        // Store original name plus a count
        authorCounts[lowerAuthor] = { name: article.author, count: 0 };
      }
      authorCounts[lowerAuthor].count++;
    });

    // Sort authors by descending post count, then alphabetically
    const sortedAuthors = Object.values(authorCounts).sort((a, b) => {
      // If counts differ, sort by count desc
      if (b.count !== a.count) return b.count - a.count;
      // Otherwise sort by name asc
      return a.name.localeCompare(b.name);
    });

    // Clear container
    authorsListContainer.innerHTML = "";

    // Build clickable author links
    sortedAuthors.forEach(authorObj => {
      const authorLink = document.createElement("a");
      authorLink.href = "#";
      authorLink.textContent = `${authorObj.name} (${authorObj.count})`;
      authorLink.classList.add("author-list-item");

      // On click, set the authorSearchInput and filter
      authorLink.addEventListener("click", (e) => {
        e.preventDefault();
        authorSearchInput.value = authorObj.name;
        filterArticles();
      });

      const div = document.createElement("div");
      div.classList.add("author-item");
      div.appendChild(authorLink);

      authorsListContainer.appendChild(div);
    });
  }
});
