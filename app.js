const LANGUAGE_MAP = {
  te: "Telugu",
  ta: "Tamil",
  kn: "Kannada",
  ml: "Malayalam",
  hi: "Hindi",
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  ru: "Russian",
  zh: "Chinese",
  ja: "Japanese",
  ko: "Korean",
  tr: "Turkish",
  ar: "Arabic",
  nl: "Dutch",
  sv: "Swedish",
  da: "Danish",
  no: "Norwegian",
  fi: "Finnish",
  pl: "Polish",
  el: "Greek",
  he: "Hebrew",
  th: "Thai",
  vi: "Vietnamese",
  id: "Indonesian",
  ms: "Malay",
  cs: "Czech",
  hu: "Hungarian",
  ro: "Romanian",
  bg: "Bulgarian",
  uk: "Ukrainian",
  sh: "Serbo-Croatian",
  sk: "Slovak",
  ca: "Catalan",
  hr: "Croatian",
  sl: "Slovenian",
  lv: "Latvian",
  lt: "Lithuanian",
  et: "Estonian",
  mk: "Macedonian",
  sq: "Albanian",
  ka: "Georgian",
  hy: "Armenian"
};

const APIURL = "https://api.themoviedb.org/3/discover/movie?sort_by=popularity.desc&api_key=YOUR-ACTUAL-TMDB-API-KEY&page=1";
const IMGPATH = "https://image.tmdb.org/t/p/w1280";
const SEARCHAPI = "https://api.themoviedb.org/3/search/movie?&api_key=YOUR-ACTUAL-TMDB-API-KEY&query=";
const CASTAPI = "https://api.themoviedb.org/3/movie/";
const TRAILERAPI = "https://api.themoviedb.org/3/movie/";

const main = document.getElementById("main");
const form = document.getElementById("form");
const search = document.getElementById("search");
const backButton = document.getElementById("back-button");
const nowPlayingButton = document.getElementById("nowPlayingButton");
const topRatedButton = document.getElementById("topRatedButton");

let currentMovies = [];
let previousMovies = [];
let isSearchPage = false;

getMovies(APIURL);

async function getMovies(url) {
  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error("Network response was not ok");
    const respData = await resp.json();
    currentMovies = respData.results;
    showMovies(currentMovies);
  } catch (error) {
    console.error("Failed to fetch movies:", error);
    main.innerHTML = "<p>Failed to load movies. Please try again later.</p>";
  }
}

async function getCastAndCrew(movieId) {
  try {
    const resp = await fetch(`${CASTAPI}${movieId}/credits?api_key=YOUR-ACTUAL-TMDB-API-KEY`);
    if (!resp.ok) throw new Error("Network response was not ok");
    const respData = await resp.json();
    
    const cast = respData.cast.slice(0, 5).map(actor => actor.name).join(", ");
    const crew = respData.crew;

    const director = crew.find(member => member.job === 'Director')?.name || "Director not available";
    const producer = crew.find(member => member.job === 'Producer')?.name || "Producer not available";

    return { cast, director, producer };
  } catch (error) {
    console.error("Failed to fetch cast and crew:", error);
    return { cast: "Cast not available", director: "Director not available", producer: "Producer not available" };
  }
}

async function getTrailer(movieId) {
  try {
    const resp = await fetch(`${TRAILERAPI}${movieId}/videos?api_key=YOUR-ACTUAL-TMDB-API-KEY`);
    if (!resp.ok) throw new Error("Network response was not ok");
    const respData = await resp.json();
    const trailer = respData.results.find(video => video.type === "Trailer" && video.site === "YouTube");
    return trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : "#";
  } catch (error) {
    console.error("Failed to fetch trailer:", error);
    return "#";
  }
}

async function showMovies(movies) {
  main.innerHTML = "";
  for (const movie of movies) {
    const { poster_path, title, vote_average, overview, id, release_date, genre_ids, original_language } = movie;
    const { cast, director, producer } = await getCastAndCrew(id);
    const trailerLink = await getTrailer(id);

    // Fetch genre names
    const genreNames = await getGenres(genre_ids);

    // Convert language code to full name
    const languageName = LANGUAGE_MAP[original_language] || original_language.toUpperCase();

    const movieEl = document.createElement("div");
    movieEl.classList.add("movie");

    movieEl.innerHTML = `
      <img src="${IMGPATH + poster_path}" alt="${title}" />
      <div class="movie-info">
        <h3>${title}</h3>
        <span class="${getClassByRate(vote_average)}">${vote_average}</span>
      </div>
      <div class="overview">
        <h2>Overview:</h2>
        ${overview}
        <h3>Release Date:</h3>
        <p class="release-date">${release_date}</p>
        <h3>Genres:</h3>
        <p class="genre">${genreNames}</p>
        <h3>Language:</h3>
        <p class="language">${languageName}</p>
        <h3>Cast:</h3>
        <p class="cast">${cast}</p>
        <h3>Director:</h3>
        <p class="director">${director}</p>
        <h3>Producer:</h3>
        <p class="producer">${producer}</p>
        <h3>Trailer:</h3>
        <a href="${trailerLink}" target="_blank" class="trailer-link">Watch Trailer</a>
      </div>
    `;

    const img = movieEl.querySelector('img');
    const overviewEl = movieEl.querySelector('.overview');

    img.addEventListener('click', () => {
      if (overviewEl.classList.contains('visible')) {
        // Hide the details if already visible
        overviewEl.classList.remove('visible');
        movieEl.classList.remove('highlighted');
      } else {
        // Show the details
        overviewEl.classList.add('visible');
        movieEl.classList.add('highlighted');
        // If on the search page, make sure to show the back button
        if (isSearchPage) {
          backButton.style.display = "block";
        }
      }
    });

    main.appendChild(movieEl);
  }
}

async function getGenres(genreIds) {
  try {
    const resp = await fetch("https://api.themoviedb.org/3/genre/movie/list?api_key=YOUR-ACTUAL-TMDB-API-KEY&language=en-US");
    if (!resp.ok) throw new Error("Network response was not ok");
    const respData = await resp.json();
    const genreMap = new Map(respData.genres.map(genre => [genre.id, genre.name]));
    return genreIds.map(id => genreMap.get(id)).join(", ");
  } catch (error) {
    console.error("Failed to fetch genres:", error);
    return "Genres not available";
  }
}

function getClassByRate(vote) {
  if (vote >= 8) {
    return 'green';
  } else if (vote >= 5) {
    return 'orange';
  } else {
    return 'red';
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const searchTerm = search.value;
  if (searchTerm) {
    try {
      const resp = await fetch(SEARCHAPI + searchTerm);
      if (!resp.ok) throw new Error("Network response was not ok");
      const respData = await resp.json();
      previousMovies = [...currentMovies]; // Store the current movies
      currentMovies = respData.results;
      isSearchPage = true; // Set flag for search page
      showMovies(currentMovies);
      backButton.style.display = "block"; // Show the back button
    } catch (error) {
      console.error("Failed to fetch movies:", error);
      main.innerHTML = "<p>Failed to load movies. Please try again later.</p>";
    }
    search.value = "";
  }
});

// Fetch Now Playing movies
async function fetchNowPlaying() {
  const NOWPLAYINGAPI = 'https://api.themoviedb.org/3/movie/now_playing?language=en-US&page=1&api_key=YOUR-ACTUAL-TMDB-API-KEY';
  getMovies(NOWPLAYINGAPI);
}

// Fetch Top Rated movies
async function fetchTopRated() {
  const TOPRATEDAPI = 'https://api.themoviedb.org/3/movie/top_rated?language=en-US&page=1&api_key=YOUR-ACTUAL-TMDB-API-KEY';
  getMovies(TOPRATEDAPI);
}

nowPlayingButton.addEventListener('click', () => {
  fetchNowPlaying();
  setActiveButton('nowPlayingButton');
});

topRatedButton.addEventListener('click', () => {
  fetchTopRated();
  setActiveButton('topRatedButton');
});

backButton.addEventListener('click', () => {
  if (previousMovies.length > 0) {
    currentMovies = [...previousMovies];
    previousMovies = [];
    showMovies(currentMovies);
    backButton.style.display = "none"; // Hide the back button
    isSearchPage = false; // Reset the search page flag
  }
});

function setActiveButton(buttonId) {
  // Remove 'active' class from all buttons
  nowPlayingButton.classList.remove('active');
  topRatedButton.classList.remove('active');
  
  // Add 'active' class to the clicked button
  document.getElementById(buttonId).classList.add('active');
}
