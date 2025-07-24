const { app, fetchCharacters } = require('./app');

const PORT = process.env.PORT || 5000;

// Start the server
app.listen(PORT, () => {
  console.log(`AI Service running on port ${PORT}`);

  // Fetch characters initially
  fetchCharacters();

  // Set up periodic refresh of characters (every 5 minutes)
  setInterval(fetchCharacters, 5 * 60 * 1000);
});
