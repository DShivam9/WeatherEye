document.addEventListener('DOMContentLoaded', () => {
    const weatherForm = document.querySelector('.weatherform');
    const cityInput = document.querySelector('.cityinput');
    const card = document.querySelector('.card');
    const loaderContainer = document.querySelector('.loader-container');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const body = document.body;
    const bgVideo = document.getElementById('bgVideo');

    const apiKey = "fd006b0cb10cb1c49b49fb4014d735d5";

    if (!weatherForm || !cityInput || !card) {
        console.error('Missing required DOM nodes (weatherform / cityinput / card).');
        return;
    }

    // Enhanced video setup for proper 1920x1080 handling
    function setupVideo() {
        if (bgVideo) {
            // Ensure video maintains proper aspect ratio for 1920x1080
            bgVideo.addEventListener('loadedmetadata', () => {
                const videoAspect = bgVideo.videoWidth / bgVideo.videoHeight;
                const screenAspect = window.innerWidth / window.innerHeight;

                if (Math.abs(videoAspect - (1920/1080)) < 0.1) {
                    // Video is close to 1920x1080, optimize display
                    if (videoAspect > screenAspect) {
                        bgVideo.style.width = 'auto';
                        bgVideo.style.height = '100vh';
                        bgVideo.style.minWidth = '100vw';
                    } else {
                        bgVideo.style.width = '100vw';
                        bgVideo.style.height = 'auto';
                        bgVideo.style.minHeight = '100vh';
                    }
                }
            });

            // Handle video errors gracefully
            bgVideo.addEventListener('error', () => {
                console.warn('Background video failed to load');
            });
        }
    }

    setupVideo();
    window.addEventListener('resize', setupVideo);

    // Dark mode init - keeping your original logic
    if (localStorage.getItem('darkMode') === 'enabled') {
        body.classList.add('dark-mode');
        if (darkModeToggle) darkModeToggle.textContent = 'Light Mode';
    } else {
        if (darkModeToggle) darkModeToggle.textContent = 'Dark Mode';
    }

    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', () => {
            if (body.classList.contains('dark-mode')) {
                body.classList.remove('dark-mode');
                localStorage.setItem('darkMode','disabled');
                darkModeToggle.textContent = 'Dark Mode';
            } else {
                body.classList.add('dark-mode');
                localStorage.setItem('darkMode','enabled');
                darkModeToggle.textContent = 'Light Mode';
            }
        });
    }

    weatherForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const city = cityInput.value.trim();
        if (!city) {
            showError("Please enter a valid city");
            return;
        }
        showLoader();
        try {
            const data = await fetchWeather(city);
            console.log('Weather response:', data);
            displayWeatherInfo(data);
        } catch (err) {
            console.error('Fetch error:', err);
            showError('Could not fetch weather data. See console for details.');
        } finally {
            hideLoader();
        }
    });

    async function fetchWeather(city) {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
        const resp = await fetch(url);
        if (!resp.ok) {
            const txt = await resp.text();
            throw new Error('API fetch failed: ' + resp.status + ' ' + resp.statusText + ' — ' + txt);
        }
        return resp.json();
    }

    function displayWeatherInfo(data) {
        const city = data.name || 'Unknown';
        const temp = data.main?.temp ?? '–';
        const humidity = data.main?.humidity ?? '–';
        const weather = (data.weather && data.weather[0]) || {};
        const description = weather.description || '';
        const id = weather.id || 800;

        // Enhanced card HTML with better weather icons
        card.innerHTML = `
      <div class="weather-content">
        <div class="weather-icon-container">${getWeatherIcon(id)}</div>
        <div class="weather-text">
          <div class="citydisplay">${escapeHtml(city)}</div>
          <div class="temp">${(typeof temp === 'number') ? temp.toFixed(1) + '°C' : temp}</div>
          <div class="humidity">Humidity: ${escapeHtml(humidity.toString())}%</div>
          <div class="desc">${escapeHtml(capitalize(description))}</div>
        </div>
      </div>
    `;

        card.style.display = 'flex';
        card.classList.add('show');

        // Enhanced background video change
        setBackgroundByWeather(id);
    }

    function getWeatherIcon(id) {
        // Enhanced weather icons with specific animations and interactivity
        if (id >= 200 && id < 300) return '<div class="weather-icon thunderstorm-icon" onclick="playThunderSound()">⛈️</div>';
        if (id >= 300 && id < 600) return '<div class="weather-icon rain-icon" onclick="playRainSound()">🌧️</div>';
        if (id >= 600 && id < 700) return '<div class="weather-icon snow-icon" onclick="playSnowSound()">❄️</div>';
        if (id >= 700 && id < 800) return '<div class="weather-icon mist-icon" onclick="playMistSound()">🌫️</div>';
        if (id === 800) return '<div class="weather-icon sun-icon" onclick="playSunSound()"></div>'; // Using your CSS sun
        if (id > 800) return '<div class="weather-icon cloud-icon" onclick="playCloudSound()">☁️</div>';
        return '<div class="weather-icon cloud-icon" onclick="playCloudSound()">☁️</div>';
    }

    function showLoader() {
        if (loaderContainer) loaderContainer.style.display = 'flex';
        card.style.display = 'none';
        card.classList.remove('show');
        if (bgVideo) {
            bgVideo.style.filter = 'brightness(.6) saturate(.9)';
            bgVideo.classList.add('changing');
        }
    }

    function hideLoader() {
        if (loaderContainer) loaderContainer.style.display = 'none';
        if (bgVideo) {
            bgVideo.style.filter = 'brightness(.78) saturate(1)';
            bgVideo.classList.remove('changing');
        }
    }

    function showError(msg) {
        card.innerHTML = `<p class="ErrorDisplay">${escapeHtml(msg)}</p>`;
        card.style.display = 'flex';
        card.classList.add('show');
    }

    // Enhanced background video change with proper 1920x1080 handling
    async function setBackgroundByWeather(weatherId) {
        if (!bgVideo) return;

        let file = 'default.mp4';
        if (weatherId >= 200 && weatherId < 600) file = 'rain.mp4';
        else if (weatherId >= 600 && weatherId < 700) file = 'snow.mp4';
        else if (weatherId === 800) file = 'sunny.mp4';
        else if (weatherId > 800) file = 'clouds.mp4';
        else if (weatherId >= 700 && weatherId < 800) file = 'fog.mp4';

        const localPath = `assets/videos/${file}`;

        try {
            // Add smooth transition
            bgVideo.classList.add('changing');
            await new Promise(r => setTimeout(r, 300));

            // Change source
            bgVideo.src = localPath;
            bgVideo.load();

            // Wait for load and play
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('Timeout')), 3000);

                bgVideo.addEventListener('loadeddata', () => {
                    clearTimeout(timeout);
                    resolve();
                }, { once: true });

                bgVideo.addEventListener('error', () => {
                    clearTimeout(timeout);
                    reject(new Error('Load error'));
                }, { once: true });
            });

            await bgVideo.play().catch(() => {});
            bgVideo.classList.remove('changing');

            // Re-apply proper sizing for 1920x1080
            setupVideo();

            console.log(`Background video changed to: ${file}`);

        } catch (e) {
            console.warn('Background video change failed (this is OK):', e);
            bgVideo.classList.remove('changing');
        }
    }

    // Helper functions - keeping your originals
    function capitalize(s){ if(!s) return ''; return s.charAt(0).toUpperCase()+s.slice(1); }
    function escapeHtml(str){ return String(str).replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }

    // Interactive sound effects (using Web Audio API for subtle feedback)
    let audioContext;

    function initAudio() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    function playTone(frequency, duration = 200, volume = 0.1) {
        initAudio();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration / 1000);
    }

    // Sound functions for weather icons
    window.playThunderSound = () => {
        playTone(80, 300, 0.05); // Deep rumble
        setTimeout(() => playTone(150, 100, 0.08), 100);
    };

    window.playRainSound = () => {
        playTone(800, 150, 0.03); // Light patter
        setTimeout(() => playTone(600, 100, 0.02), 50);
    };

    window.playSnowSound = () => {
        playTone(1200, 200, 0.02); // Soft tinkle
    };

    window.playMistSound = () => {
        playTone(400, 400, 0.02); // Soft whoosh
    };

    window.playSunSound = () => {
        playTone(440, 150, 0.04); // Bright tone
        setTimeout(() => playTone(880, 100, 0.03), 75);
    };

    window.playCloudSound = () => {
        playTone(300, 250, 0.03); // Soft cloud tone
    };

    // Add card click interaction
    card.addEventListener('click', (e) => {
        if (e.target.closest('.weather-icon-container')) return; // Don't trigger if clicking icon

        // Refresh weather data
        const currentCity = card.querySelector('.citydisplay')?.textContent;
        if (currentCity && currentCity !== 'Unknown') {
            playTone(523, 100, 0.04); // Pleasant refresh sound

            // Visual feedback
            card.style.transform = 'scale(0.98)';
            setTimeout(() => {
                card.style.transform = '';
            }, 150);

            console.log('Card clicked - refreshing weather for:', currentCity);
            // Could add actual refresh functionality here if desired
        }
    });

});