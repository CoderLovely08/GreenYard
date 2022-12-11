navigator.share({
    title: 'Your page title',
    text: 'Your page description',
    url: 'https://your_url.com',
  })
  .then(() => {
    // Sharing was successful
  })
  .catch((error) => {
    // Sharing failed
  })