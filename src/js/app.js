document.addEventListener('DOMContentLoaded', () => {
    const audio = document.getElementById('audio');
    const playButton = document.getElementById('play');
    const pauseButton = document.getElementById('pause');
    const prevButton = document.getElementById('prev');
    const nextButton = document.getElementById('next');
    const progress = document.getElementById('progress');
    const volumeControl = document.getElementById('volume');
    const currentTimeSpan = document.getElementById('current-time');
    const durationSpan = document.getElementById('duration');
    const musicList = document.getElementById('music-list');
    const repeatButton = document.getElementById('repeatButton');
    const autoPlayButton = document.getElementById('autoPlayButton');

    let isPlaying = false;
    let musicFiles = [];
    let currentTrackIndex = 0;

    const bgColor = '#018E42';
    const textColor = '#FDFFFC';

    document.getElementById('file-input').addEventListener('change', handleFileSelect);

    function handleFileSelect(event) {
        const files = event.target.files;

        // If there is a currently playing song, remove it from the track list
        if (isPlaying && currentTrackIndex !== -1) {
            musicFiles.splice(currentTrackIndex, 1);
            // Stop the audio playback
            pauseAudio();
            audio.currentTime = 0;
            isPlaying = false;

            // Clear the current playing song details from the UI
            document.getElementById('currentTrackTitle').textContent = '';
            document.getElementById('currentTrackArtist').textContent = '';
            document.getElementById('currentTrackImage').src = 'assets/ico/Music_Icon.svg'; // Assuming there's an element for the thumbnail
        }

        musicFiles = [];
        musicList.innerHTML = ''; // Clear previous list
        const supportedAudioTypes = [
            'audio/mpeg',  // MP3
            'audio/wav',   // WAV
            'audio/ogg',   // OGG
            'audio/aac',   // AAC
            'audio/mp4'    // M4A (usually audio/mp4 for .m4a files)
        ];

        const supportedVideoTypes = [
            'video/mp4',   // MP4
            'video/webm',  // WebM
            'video/ogg'    // OGG
        ];

        for (const file of files) {
            if (supportedAudioTypes.includes(file.type) || file.type.startsWith('audio/')) {
                const url = URL.createObjectURL(file);
                musicFiles.push({
                    file: file,
                    url: url,
                    thumbnail: null,
                    type: 'audio'
                });
            } else if (supportedVideoTypes.includes(file.type) || file.type.startsWith('video/')) {
                // Handle video files
                const url = URL.createObjectURL(file);
                musicFiles.push({
                    file: file,
                    url: url,
                    thumbnail: null,
                    type: 'video'
                });
            }
        }
        createMusicList();
    }

    function changePlayToLoading(index) {
        // Get all items with the 'loader' class
        const items = document.querySelectorAll('.loader');

        // Reset the class and styles for all items
        items.forEach((el) => {
            el.style.backgroundColor = ''; // Reset background color
            el.querySelectorAll('p').forEach(p => p.style.color = ''); // Reset text color
            const playDiv = el.querySelector('.loading') || el.querySelector('.play');
            if (playDiv) {
                playDiv.className = 'play'; // Change class back to 'play'
                playDiv.innerHTML = ''; // Clear out any children in the loading div
            }
        });

        // Select the current item by index
        const currentItem = items[index];

        if (currentItem) {
            // Set background color and text color, and change class to loading
            currentItem.style.backgroundColor = bgColor;
            currentItem.querySelectorAll('p').forEach(p => p.style.color = textColor);

            // Find the play div and change it to loading
            const playDiv = currentItem.querySelector('.play');
            if (playDiv) {
                playDiv.className = 'loading'; // Change class from 'play' to 'loading'

                // Create and append 4 divs with the class 'load'
                for (let i = 0; i < 4; i++) {
                    const loadDiv = document.createElement('div');
                    loadDiv.className = 'load';
                    playDiv.appendChild(loadDiv);
                }
            }
        }
        // Update UI elements for the current track
        updateCurrentPlayingSongListUI(currentItem); // Update UI based on the new track
        checkAndApplyScrolling(); // Ensure scrolling effect is applied
    }

    function createMusicList() {
        musicFiles.forEach((track, index) => {
            const item = document.createElement('div');
            item.className = 'loader'; // Use 'loader' class as the container for each track

            // Click event listener for the item
            item.addEventListener('click', () => {
                if (currentTrackIndex === index) {
                    handlePlayPause();
                } else {
                    // If a different track is clicked, load and play the new track
                    loadTrack(index);
                    currentTrackIndex = index;

                    // Change the play class to loading for the clicked item
                    changePlayToLoading(currentTrackIndex);
                }
            });

            // Create and append song details
            const songDetails = document.createElement('div');
            songDetails.className = 'song';

            // jsmediatags.read(track.file, {
            //     onSuccess: function (tag) {
            //         const tags = tag.tags;

            //         // Extract and display the title
            //         songName.textContent = tags.title || 'Unknown Title';

            //         // Extract and display the artist
            //         songArtist.textContent = tags.artist || 'Unknown Artist';
            //     }
            // });

            // const songName = document.createElement('p');
            // songName.className = 'name';
            // songName.textContent = track.title || 'Unknown Title'; // Use track title or fallback
            // songDetails.appendChild(songName);

            // const songArtist = document.createElement('p');
            // songArtist.className = 'artist';
            // songArtist.textContent = track.artist || 'Unknown Artist'; // Use track artist or fallback
            // songDetails.appendChild(songArtist);

            // Extract metadata if the file is an audio file
            if (track.file.type.startsWith('audio/')) {
                jsmediatags.read(track.file, {
                    onSuccess: function (tag) {
                        const tags = tag.tags;

                        // Extract and display the title
                        const songName = document.createElement('p');
                        songName.className = 'name';
                        songName.textContent = tags.title || 'Unknown Title'; // Use track title or fallback
                        songDetails.appendChild(songName);

                        // Extract and display the artist
                        const songArtist = document.createElement('p');
                        songArtist.className = 'artist';
                        songArtist.textContent = tags.artist || 'Unknown Artist'; // Use track artist or fallback
                        songDetails.appendChild(songArtist);
                    },
                    onError: function () {
                        // Fallback if metadata extraction fails
                        const songName = document.createElement('p');
                        songName.className = 'name';
                        songName.textContent = track.file.name; // Use file name as a fallback
                        songDetails.appendChild(songName);

                        const songArtist = document.createElement('p');
                        songArtist.className = 'artist';
                        songArtist.textContent = 'Unknown Artist'; // Use fallback artist
                        songDetails.appendChild(songArtist);
                    }
                });
            } else {
                // For video files, display the file name as the title
                const songName = document.createElement('p');
                songName.className = 'name';
                songName.textContent = track.file.name; // Use file name as title for video
                songDetails.appendChild(songName);

                const songArtist = document.createElement('p');
                songArtist.className = 'artist';
                songArtist.textContent = 'Video File'; // Use a placeholder for artist
                songDetails.appendChild(songArtist);
            }

            item.appendChild(songDetails);

            // Create and append album cover
            const albumCover = document.createElement('div');
            albumCover.className = 'albumcover';

            const thumbnail = document.createElement('img');
            // Check if the thumbnail is available in the track object
            if (track.thumbnail) {
                thumbnail.src = track.thumbnail;
            } else {
                // Extract thumbnail if not already available
                jsmediatags.read(track.file, {
                    onSuccess: function (tag) {
                        const tags = tag.tags;

                        if (tags.picture) {
                            const base64String = tags.picture.data.reduce((data, byte) => {
                                return data + String.fromCharCode(byte);
                            }, '');
                            const base64Image = `data:${tags.picture.format};base64,${btoa(base64String)}`;
                            thumbnail.src = base64Image;
                        } else {
                            thumbnail.src = 'assets/ico/Music_Icon.svg'; // Fallback to default image
                        }
                    },
                    onError: function () {
                        thumbnail.src = 'assets/ico/Music_Icon.svg'; // Fallback to default image
                    }
                });
            }

            albumCover.appendChild(thumbnail);
            item.appendChild(albumCover);

            // Create and append play button
            const playButton = document.createElement('div');
            playButton.className = 'play';
            playButton.addEventListener('click', () => {
                loadTrack(index);
                currentTrackIndex = index;
            });

            item.appendChild(playButton);

            // Append the item to the music list container
            const musicList = document.getElementById('music-list');
            musicList.appendChild(item);
        });
    }

    function displayCurrentTrackImage(track) {
        const currentTrackImage = document.getElementById('currentTrackImage');
        const currentTrackTitle = document.getElementById('currentTrackTitle');
        const currentTrackArtist = document.getElementById('currentTrackArtist');

        // Check if the track is an audio file
        if (track.file.type.startsWith('audio/')) {
            if (track.thumbnail) {
                currentTrackImage.src = track.thumbnail;
            } else {
                // Extract the thumbnail and metadata from the audio file if not already available
                jsmediatags.read(track.file, {
                    onSuccess: function (tag) {
                        const tags = tag.tags;

                        // Extract and display the title
                        currentTrackTitle.textContent = tags.title || 'Unknown Title';

                        // Extract and display the artist
                        currentTrackArtist.textContent = tags.artist || 'Unknown Artist';

                        if (tags.picture) {
                            const base64String = tags.picture.data.reduce((data, byte) => {
                                return data + String.fromCharCode(byte);
                            }, '');
                            const base64Image = `data:${tags.picture.format};base64,${btoa(base64String)}`;
                            currentTrackImage.src = base64Image;
                        } else {
                            currentTrackImage.src = 'assets/ico/Music_Icon.svg'; // Fallback to default image
                        }
                    },
                    onError: function () {
                        currentTrackImage.src = 'assets/ico/Music_Icon.svg'; // Fallback to default image
                    }
                });
            }
        } else if (track.file.type.startsWith('video/')) {
            // For video files, use a default video thumbnail or a generic icon
            currentTrackTitle.textContent = track.file.name; // Use file name as title for video
            currentTrackArtist.textContent = 'Video File'; // Use a placeholder for artist
            currentTrackImage.src = 'assets/ico/Music_Icon.svg'; // Use a generic video icon as thumbnail

            const video = document.createElement('video');
            video.src = URL.createObjectURL(track.file);

            // video.addEventListener('loadeddata', () => {
            //     video.currentTime = 5; // Seek to 2 seconds to capture a frame

            //     video.addEventListener('seeked', () => {
            //         const canvas = document.createElement('canvas');
            //         canvas.width = video.videoWidth;
            //         canvas.height = video.videoHeight;

            //         const ctx = canvas.getContext('2d');
            //         ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            //         // Convert canvas to image data URL
            //         const thumbnailDataUrl = canvas.toDataURL('image/png');
            //         currentTrackImage.src = thumbnailDataUrl;

            //         // Set the track title and artist
            //         currentTrackTitle.textContent = track.file.name; // Use file name as title for video
            //         currentTrackArtist.textContent = 'Video File'; // Use a placeholder for artist

            //         // Revoke the object URL to free up memory
            //         URL.revokeObjectURL(video.src);
            //     });
            // });
            // video.load(); // Load the video to trigger the events
        } else {
            // Fallback for unknown file types
            currentTrackTitle.textContent = 'Unknown Title';
            currentTrackArtist.textContent = 'Unknown Artist';
            currentTrackImage.src = 'assets/ico/Music_Icon.svg'; // Use a generic icon for unknown file types
        }
    }

    function checkAndApplyScrolling() {
        const currentTitleBox = document.querySelector('.music-titleBox');
        const currentTitleElement = document.getElementById('currentTrackTitle');

        // Reset scrolling class for the current track title
        if (currentTitleElement) {
            currentTitleElement.classList.remove('scrolling');

            // Check if content is overflowing
            if (currentTitleElement.scrollWidth > currentTitleBox.clientWidth) {
                currentTitleElement.classList.add('scrolling');
            } else {
                currentTitleElement.classList.remove('scrolling');
            }
        }

        const listTitleBox = document.querySelector('#selectedSong .song');
        const listTitleElement = listTitleBox ? listTitleBox.querySelector('.name') : null;

        // Reset scrolling class for the selected song name
        if (listTitleElement) {
            listTitleElement.classList.remove('scrolling');

            // Check if content is overflowing
            if (listTitleElement.scrollWidth > listTitleBox.clientWidth) {
                listTitleElement.classList.add('scrolling');
            } else {
                listTitleElement.classList.remove('scrolling');
            }
        }
    }

    function updateCurrentPlayingSongListUI(item) {
        // Remove 'selectedSong' id from any previously selected loader
        const previousSelectedLoader = document.getElementById('selectedSong');
        if (previousSelectedLoader) {
            // Remove 'selectedSong' id from the previous .loader
            previousSelectedLoader.removeAttribute('id');

            // Remove 'scrolling' class from the .name element within the previous .loader's .song
            const previousSongElement = previousSelectedLoader.querySelector('.song .name');
            if (previousSongElement) {
                previousSongElement.classList.remove('scrolling');
            }

            // Also remove the 'scrolling' class from the current track title
            const currentTitleElement = document.getElementById('currentTrackTitle');
            if (currentTitleElement) {
                currentTitleElement.classList.remove('scrolling');
            }
        }

        // Add 'selectedSong' id to the clicked item's .loader
        const newLoader = item.closest('.loader');
        if (newLoader) {
            newLoader.id = 'selectedSong';

            // Optionally, remove the scrolling class from the new .song element
            const newSongElement = newLoader.querySelector('.song .name');
            if (newSongElement) {
                newSongElement.classList.remove('scrolling');
            }
        }
    }

    function showPopupMessage(message) {
        // Check if there's already a popup message visible and remove it
        const existingPopup = document.querySelector('.popup-message.show');
        if (existingPopup) {
            existingPopup.classList.remove('show');
            setTimeout(() => {
                existingPopup.remove();
            }, 300); // Time for the CSS transition to hide the popup
        }

        const popup = document.createElement('div');
        popup.className = 'popup-message';
        popup.textContent = message;
        document.body.appendChild(popup);

        setTimeout(() => {
            popup.classList.add('show');
        }, 10); // Delay to trigger CSS transition

        setTimeout(() => {
            popup.classList.remove('show');
            setTimeout(() => {
                popup.remove();
            }, 300); // Time for the CSS transition to hide the popup
        }, 2000); // Display for 2 seconds
    }

    function handlePlayPause() {
        // Check if there are no tracks in the list
        if (musicFiles.length === 0) {
            showPopupMessage("No tracks available to play.");
            return; // Exit the function early
        }
        if (audio.paused) {
            // If the audio is paused and no song is playing, play the current song
            if (!isPlaying && audio.currentTime === 0) {
                loadTrack(currentTrackIndex);
                playAudio();
            } else {
                // Otherwise, resume playback
                playAudio();
            }
        } else {
            // If the audio is playing, pause it
            pauseAudio();
        }
    }

    // Spacebar and arrow keys event listener
    document.addEventListener('keydown', (event) => {
        switch (event.code) {
            case 'Space':
                event.preventDefault(); // Prevent default behavior for spacebar
                handlePlayPause();
                break;

            case 'ArrowRight':
                event.preventDefault(); // Prevent default behavior for right arrow
                playNextTrack();
                break;

            case 'ArrowLeft':
                event.preventDefault(); // Prevent default behavior for left arrow
                playPreviousTrack();
                break;

            case 'MediaPlayPause': // Play/Pause button
                handlePlayPause();
                break;

            case 'MediaStop': // Stop button
                pauseAudio();
                audio.currentTime = 0; // Reset to the beginning of the track
                break;

            case 'MediaTrackNext': // Next button
                playNextTrack();
                break;

            case 'MediaTrackPrevious': // Previous button
                playPreviousTrack();
                break;
        }

        switch (event.key) {
            case 'm':
                toggleMute();
                break;
        }
    });

    const defaultTitle = 'WebPlay | Offline Music Player'; // Set your default page title here

    let originalTitle = '';
    let titleIndex = 0;
    let titleInterval;

    function scrollTitle() {
        if (originalTitle.length > 0) {
            document.title = originalTitle.slice(titleIndex) + ' - ' + originalTitle.slice(0, titleIndex);
            titleIndex = (titleIndex + 1) % originalTitle.length;
        }
    }

    function startScrollingTitle(musicTitle) {
        originalTitle = `${musicTitle} - Now Playing`;
        titleIndex = 0; // Reset the index
        clearInterval(titleInterval); // Clear any existing intervals
        scrollTitle(); // Set the initial title
        titleInterval = setInterval(scrollTitle, 250); // Start the scrolling
    }

    function resetTitle() {
        clearInterval(titleInterval); // Stop scrolling
        document.title = defaultTitle; // Reset to the default title
    }
    resetTitle();

    function playAudio() {
        audio.play();
        playButton.style.display = 'none';
        pauseButton.style.display = 'inline';
        isPlaying = true;

        // Update the UI of the current track
        const items = document.querySelectorAll('.loader');
        const currentItem = items[currentTrackIndex];

        if (currentItem) {
            currentItem.style.backgroundColor = bgColor;
            currentItem.querySelectorAll('p').forEach(p => p.style.color = textColor);

            // Find the play div and change it to loading
            const playDiv = currentItem.querySelector('.play');

            if (playDiv) {
                playDiv.style.backgroundColor = ''; // Ensure the color is white
                playDiv.className = 'loading'; // Change class from 'play' to 'loading'
                // Create and append 4 divs with the class 'load'
                for (let i = 0; i < 4; i++) {
                    const loadDiv = document.createElement('div');
                    loadDiv.className = 'load';
                    playDiv.appendChild(loadDiv);
                }
            }
            // Update the page title with the music title
            const musicTitle = currentItem.querySelector('.name').textContent || 'Music Player By Biplove';
            // document.title = `${musicTitle} - Now Playing`;
            startScrollingTitle(musicTitle);

            // Set the music thumbnail as the favicon
            const thumbnailUrl = currentItem.querySelector('.albumcover img').src;
            setFavicon(thumbnailUrl);
        }

        // Function to set the favicon dynamically
        function setFavicon(iconUrl) {
            let link = document.querySelector("link[rel~='icon']");
            if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.getElementsByTagName('head')[0].appendChild(link);
            }
            link.href = iconUrl;
        }

        const player = document.getElementById("music");
        const playerAnimation = document.querySelector(".music-playing-bars");
        // Only toggle the animation class if the musicAnimation checkbox is not checked
        if (!musicAnimation.checked) {
            player.classList.add("paused");
            playerAnimation.style.visibility = 'hidden';
        } else {
            player.classList.remove("paused");
            playerAnimation.style.visibility = 'visible';
        }
    }

    function pauseAudio() {
        audio.pause();
        playButton.style.display = 'inline';
        pauseButton.style.display = 'none';
        isPlaying = false;

        resetTitle(); // Reset to the default title when paused

        // Update the UI of the current track
        const items = document.querySelectorAll('.loader');
        const currentItem = items[currentTrackIndex];

        if (currentItem) {
            // Find the loading div and change it to play
            const loadingDiv = currentItem.querySelector('.loading');
            if (loadingDiv) {
                loadingDiv.className = 'play'; // Change class from 'loading' to 'play'
                loadingDiv.innerHTML = ''; // Clear out any children in the play div
            }
        }

        const player = document.getElementById("music");
        const playerAnimation = document.querySelector(".music-playing-bars");
        if (!musicAnimation.checked) {
            player.classList.add("paused");
            playerAnimation.style.visibility = 'hidden';
        } else {
            player.classList.add("paused");
            playerAnimation.style.visibility = 'hidden';
        }
    }

    function updateProgress() {
        const value = (audio.currentTime / audio.duration) * 100;
        progress.value = value;
        currentTimeSpan.textContent = formatTime(audio.currentTime);
        durationSpan.textContent = formatTime(audio.duration);
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    function loadTrack(index) {
        if (musicFiles.length > 0) {
            const track = musicFiles[index];
            displayCurrentTrackImage(track);

            // Set the audio source and play the track
            audio.src = track.url;
            audio.addEventListener('canplaythrough', () => {
                playAudio(); // Play the track when it's ready
                changePlayToLoading(index); // Apply the loading state after track is loaded
            }, { once: true }); // Ensure the event listener is only used once

            // Handle animation class
            const player = document.getElementById("music");
            if (!musicAnimation.checked) {
                player.classList.add("paused");
            } else {
                player.classList.remove("paused");
            }
        }
    }

    function seek() {
        const value = progress.value;
        const time = (value / 100) * audio.duration;
        audio.currentTime = time;
    }

    function updateVolume() {
        const volumeDisplay = document.getElementById('volumeDisplay');

        // Update audio volume
        audio.volume = volumeControl.value;

        // Update volume percentage display
        const volumePercentage = Math.round(volumeControl.value * 100);
        volumeDisplay.textContent = `${volumePercentage}%`;
    }

    // Event listener for when the audio is played
    playButton.addEventListener('click', () => {
        // Check if there are no tracks in the list
        if (musicFiles.length === 0) {
            showPopupMessage("No tracks available to play.");
            return; // Exit the function early
        }

        if (!isPlaying) {
            if (audio.currentTime > 0) {
                audio.play(); // Resume from where the track was paused
            } else {
                loadTrack(currentTrackIndex); // Load and play the current track
            }
            playAudio(); // Update the UI and set isPlaying to true
        }
    });

    // Event listener for when the audio is paused
    pauseButton.addEventListener('click', () => {
        pauseAudio(); // Pause the audio
    });

    prevButton.addEventListener('click', () => {
        playPreviousTrack();
    });

    nextButton.addEventListener('click', () => {
        playNextTrack();
    });

    // Function to play the previous track
    function playPreviousTrack() {
        if (musicFiles.length === 0) {
            showPopupMessage("No songs available in the playlist.");
            return; // Exit the function if there are no songs
        } else if (musicFiles.length === 1) {
            showPopupMessage("Only one song in the playlist.");
            return; // Exit the function if there is only one song
        }

        currentTrackIndex = (currentTrackIndex - 1 + musicFiles.length) % musicFiles.length;
        loadTrack(currentTrackIndex);
    }

    // Function to play the next track
    function playNextTrack() {
        if (musicFiles.length === 0) {
            showPopupMessage("No songs available in the playlist.");
            return; // Exit the function if there are no songs
        } else if (musicFiles.length === 1) {
            showPopupMessage("Only one song in the playlist.");
            return; // Exit the function if there is only one song
        }

        // Proceed to the next track if there are multiple songs
        currentTrackIndex = (currentTrackIndex + 1) % musicFiles.length;
        loadTrack(currentTrackIndex);
    }



    volumeControl.addEventListener('input', updateVolume);
    progress.addEventListener('input', seek);
    audio.addEventListener('timeupdate', updateProgress);

    // Function to play the next track or repeat the current track
    function AutoplayNextTrack() {
        if (repeatButton.checked) {
            loadTrack(currentTrackIndex); // Repeat the same track
        } else if (currentTrackIndex < musicFiles.length - 1) {
            currentTrackIndex += 1; // Move to the next track
            loadTrack(currentTrackIndex);
        } else if (autoPlayButton.checked) {
            currentTrackIndex = 0; // Restart from the first track if autoplay is checked
            loadTrack(currentTrackIndex);
        } else {
            pauseAudio();
            audio.currentTime = 0; // Reset track to start
        }
    }

    // Event listener for when the audio ends
    audio.addEventListener('ended', AutoplayNextTrack);

    const currentplaying = document.querySelector('.currentplayingIcon');
    const repeatOnebtn = document.getElementById('repeatOnebtn');
    const AutoPlaybtn = document.getElementById('AutoPlaybtn');
    const playingListMenu = document.getElementById('playingListMenu');
    const animationBtn = document.getElementById('animationBtn');
    const fullscreenIcon = document.getElementById('fullscreenIcon');
    const SpeakerBtn = document.querySelector('.SpeakerBtn');

    // SVG content as a string
    const currentplayingIcon = `
    <svg class="currentplayingIcon" width="50px" height="50px" viewBox="0 -3 48 48" xmlns="http://www.w3.org/2000/svg" fill="#000000">
    <g id="SVGRepo_bgCarrier" stroke-width="0"/>
    <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"/>
    <g id="SVGRepo_iconCarrier"> <g id="Group_41" data-name="Group 41" transform="translate(-501 -342)"> <circle id="Ellipse_8" data-name="Ellipse 8" cx="2" cy="2" r="2" transform="translate(516 366)" fill="#7d50f9"/> <g id="Group_40" data-name="Group 40"> <path id="Path_51" data-name="Path 51" d="M533,380a2,2,0,0,1-2,2H505a2,2,0,0,1-2-2V346a2,2,0,0,1,2-2h26a2,2,0,0,1,2,2v12h2V346a4,4,0,0,0-4-4H505a4,4,0,0,0-4,4v34a4,4,0,0,0,4,4h26a4,4,0,0,0,4-4v-2h-2Z" fill="#ffffff"/> <path id="Path_52" data-name="Path 52" d="M518,378a10,10,0,1,0-10-10A10.011,10.011,0,0,0,518,378Zm0-18a8,8,0,1,1-8,8A8.009,8.009,0,0,1,518,360Z" fill="#ffffff"/> <rect id="Rectangle_20" data-name="Rectangle 20" width="2" height="12" transform="translate(541 362)" fill="#ffffff"/> <rect id="Rectangle_21" data-name="Rectangle 21" width="2" height="24" transform="translate(547 356)" fill="#ffffff"/> <rect id="Rectangle_22" data-name="Rectangle 22" width="2" height="6" transform="translate(535 365)" fill="#ffffff"/> <path id="Path_53" data-name="Path 53" d="M512,351a2,2,0,1,0-2,2A2,2,0,0,0,512,351Zm-2,0v1l0-1Z" fill="#ffffff"/> <path id="Path_54" data-name="Path 54" d="M526,349a2,2,0,1,0,2,2A2,2,0,0,0,526,349Zm0,3,0-1h0Z" fill="#ffffff"/> <path id="Path_55" data-name="Path 55" d="M520,351a2,2,0,1,0-2,2A2,2,0,0,0,520,351Zm-2,0v1l0-1Z" fill="#ffffff"/> <path id="Path_56" data-name="Path 56" d="M518,374a6,6,0,1,0-6-6A6.006,6.006,0,0,0,518,374Zm0-10a4,4,0,1,1-4,4A4,4,0,0,1,518,364Z" fill="#ffffff"/> </g> </g> </g>
    </svg>`;

    const play = `
    <svg width="24px" height="24px" viewBox="-1 0 12 12" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#000000">
    <g id="SVGRepo_bgCarrier" stroke-width="0"/>
    <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"/>
    <g id="SVGRepo_iconCarrier"> <title>Play Music</title> <defs> </defs> <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="Dribbble-Light-Preview" transform="translate(-65.000000, -3803.000000)" fill="#1C274C"> <g id="icons" transform="translate(56.000000, 160.000000)"> <path d="M18.074,3650.7335 L12.308,3654.6315 C10.903,3655.5815 9,3654.5835 9,3652.8985 L9,3645.1015 C9,3643.4155 10.903,3642.4185 12.308,3643.3685 L18.074,3647.2665 C19.306,3648.0995 19.306,3649.9005 18.074,3650.7335" id="play-[#1C274C]"> </path> </g> </g> </g> </g>
    </svg>`;
    const pause = `
    <svg width="24px" height="24px" viewBox="-1 0 8 8" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#000000">
    <g id="SVGRepo_bgCarrier" stroke-width="0"/>
    <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"/>
    <g id="SVGRepo_iconCarrier"> <title>Pause Music</title> <defs> </defs> <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="Dribbble-Light-Preview" transform="translate(-227.000000, -3765.000000)" fill="#1C274C"> <g id="icons" transform="translate(56.000000, 160.000000)"> <path d="M172,3605 C171.448,3605 171,3605.448 171,3606 L171,3612 C171,3612.552 171.448,3613 172,3613 C172.552,3613 173,3612.552 173,3612 L173,3606 C173,3605.448 172.552,3605 172,3605 M177,3606 L177,3612 C177,3612.552 176.552,3613 176,3613 C175.448,3613 175,3612.552 175,3612 L175,3606 C175,3605.448 175.448,3605 176,3605 C176.552,3605 177,3605.448 177,3606" id="pause-[#1C274C]"> </path> </g> </g> </g> </g>
    </svg>`;
    const prev = `
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g id="SVGRepo_bgCarrier" stroke-width="0"/>
    <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"/>
    <g id="SVGRepo_iconCarrier"> <title>Play Previous</title> <path d="M8.09015 14.6474C6.30328 13.4935 6.30328 10.5065 8.09015 9.35258L18.8792 2.38548C20.6158 1.26402 22.75 2.72368 22.75 5.0329V18.9671C22.75 21.2763 20.6158 22.736 18.8792 21.6145L8.09015 14.6474Z" fill="#1C274C"/> <path d="M2 5C2 4.58579 2.33579 4.25 2.75 4.25C3.16421 4.25 3.5 4.58579 3.5 5V19C3.5 19.4142 3.16421 19.75 2.75 19.75C2.33579 19.75 2 19.4142 2 19V5Z" fill="#1C274C"/> </g>
    </svg>`;
    const next = `
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g id="SVGRepo_bgCarrier" stroke-width="0"/>
    <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"/>
    <g id="SVGRepo_iconCarrier"> <title>Play Next</title> <path d="M16.6598 14.6474C18.4467 13.4935 18.4467 10.5065 16.6598 9.35258L5.87083 2.38548C4.13419 1.26402 2 2.72368 2 5.0329V18.9671C2 21.2763 4.13419 22.736 5.87083 21.6145L16.6598 14.6474Z" fill="#1C274C"/> <path d="M22.75 5C22.75 4.58579 22.4142 4.25 22 4.25C21.5858 4.25 21.25 4.58579 21.25 5V19C21.25 19.4142 21.5858 19.75 22 19.75C22.4142 19.75 22.75 19.4142 22.75 19V5Z" fill="#1C274C"/> </g>
    </svg>`;

    const repeatOnenot = `
    <svg fill="#09244B" width="24px" height="24px" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
    <g id="SVGRepo_bgCarrier" stroke-width="0"/>
    <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"/>
    <g id="SVGRepo_iconCarrier">
    <path d="M 2.3829 26.2891 C 2.3829 27.7187 3.5314 28.8672 4.9611 28.8672 C 6.4142 28.8672 7.5626 27.7187 7.5626 26.2891 L 7.5626 24.7422 C 7.5626 21.0156 10.1173 18.5547 13.9611 18.5547 L 31.6564 18.5547 L 31.6564 23.4531 C 31.6564 24.7187 32.4532 25.5156 33.7423 25.5156 C 34.3048 25.5156 34.8907 25.3047 35.3360 24.9297 L 44.1954 17.6172 C 45.2502 16.7734 45.2502 15.3672 44.1954 14.4765 L 35.3360 7.1172 C 34.8907 6.7656 34.3048 6.5313 33.7423 6.5313 C 32.4532 6.5313 31.6564 7.3516 31.6564 8.6172 L 31.6564 13.4687 L 14.4532 13.4687 C 7.0938 13.4687 2.3829 17.7109 2.3829 24.3672 Z M 24.3438 32.5703 C 24.3438 31.3047 23.5470 30.5078 22.2579 30.5078 C 21.6954 30.5078 21.1095 30.7187 20.6642 31.0703 L 11.8048 38.3828 C 10.7501 39.2500 10.7501 40.6328 11.8048 41.5234 L 20.6642 48.8828 C 21.1095 49.2578 21.6954 49.4687 22.2579 49.4687 C 23.5470 49.4687 24.3438 48.6719 24.3438 47.4062 L 24.3438 42.5078 L 41.5470 42.5078 C 48.9064 42.5078 53.6171 38.2422 53.6171 31.6094 L 53.6171 29.6875 C 53.6171 28.2344 52.4689 27.0860 51.0160 27.0860 C 49.5860 27.0860 48.4374 28.2344 48.4374 29.6875 L 48.4374 31.2344 C 48.4374 34.9375 45.8828 37.4219 42.0392 37.4219 L 24.3438 37.4219 Z"/>
    </g>
    </svg>`;
    const repeatOne = `
    <svg fill="#09244B" width="24px" height="24px" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
    <g id="SVGRepo_bgCarrier" stroke-width="0"/>
    <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"/>
    <g id="SVGRepo_iconCarrier">
    <path d="M 51.0625 22.4102 C 52.5160 22.4102 53.3128 21.6133 53.3128 20.1133 L 53.3128 9.2149 C 53.3128 7.5273 52.2347 6.4023 50.5940 6.4023 C 49.2112 6.4023 48.4144 6.8476 47.3128 7.6914 L 44.3126 10.0117 C 43.7735 10.4336 43.5626 10.9023 43.5626 11.4180 C 43.5626 12.1680 44.1251 12.8008 45.0860 12.8008 C 45.4609 12.8008 45.8363 12.6836 46.1641 12.4023 L 48.5780 10.4570 L 48.7657 10.4570 L 48.7657 20.1133 C 48.7657 21.6133 49.5860 22.4102 51.0625 22.4102 Z M 2.3829 26.4180 C 2.3829 27.8476 3.5314 28.9961 4.9611 28.9961 C 6.4142 28.9961 7.5626 27.8476 7.5626 26.4180 L 7.5626 24.8711 C 7.5626 21.1445 10.1173 18.6836 13.9611 18.6836 L 26.6173 18.6836 L 26.6173 23.5820 C 26.6173 24.8476 27.4376 25.6445 28.7267 25.6445 C 29.2892 25.6445 29.8751 25.4336 30.3204 25.0586 L 39.1798 17.7461 C 40.2345 16.8789 40.2111 15.4961 39.1798 14.6055 L 30.3204 7.2461 C 29.8751 6.8945 29.2892 6.6602 28.7267 6.6602 C 27.4376 6.6602 26.6173 7.4805 26.6173 8.7461 L 26.6173 13.5976 L 14.4532 13.5976 C 7.0938 13.5976 2.3829 17.8398 2.3829 24.4961 Z M 24.3438 32.6992 C 24.3438 31.4336 23.5470 30.6367 22.2579 30.6367 C 21.6954 30.6367 21.1095 30.8476 20.6642 31.1992 L 11.8048 38.5117 C 10.7501 39.3789 10.7501 40.7617 11.8048 41.6523 L 20.6642 49.0117 C 21.1095 49.3867 21.6954 49.5977 22.2579 49.5977 C 23.5470 49.5977 24.3438 48.8008 24.3438 47.5352 L 24.3438 42.6367 L 41.5470 42.6367 C 48.9064 42.6367 53.6171 38.3711 53.6171 31.7383 L 53.6171 29.8164 C 53.6171 28.3633 52.4689 27.2149 51.0160 27.2149 C 49.5860 27.2149 48.4374 28.3633 48.4374 29.8164 L 48.4374 31.3633 C 48.4374 35.0664 45.8828 37.5508 42.0392 37.5508 L 24.3438 37.5508 Z"/>
    </g>
    </svg>`;
    const AutoPlayAllnot = `
    <svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#000000">
    <g id="SVGRepo_bgCarrier" stroke-width="0"/>
    <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"/>
    <g id="SVGRepo_iconCarrier">
    <g id="🔍-System-Icons" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="ic_fluent_arrow_repeat_all_off_24_filled" fill="#1C274C" fill-rule="nonzero"> <path d="M3.61289944,2.20970461 L3.70710678,2.29289322 L21.7071068,20.2928932 C22.0976311,20.6834175 22.0976311,21.3165825 21.7071068,21.7071068 C21.3466228,22.0675907 20.7793918,22.0953203 20.3871006,21.7902954 L20.2928932,21.7071068 L17.224891,18.6392317 C16.6259787,18.8398015 15.9909553,18.9615916 15.3321275,18.9922955 L15.0007869,19 L9.405,18.99937 L10.7086806,20.3033009 L10.7863869,20.3905217 C11.0972124,20.7830393 11.0713103,21.3548847 10.7086806,21.7175144 C10.3481966,22.0779984 9.78096555,22.1057279 9.38867434,21.800703 L9.29446701,21.7175144 L6.28926319,18.7123106 L6.21155682,18.6250898 C5.92663349,18.2652819 5.92465485,17.754789 6.20562092,17.3928883 L6.28926319,17.298097 L9.29446701,14.2928932 L9.38168782,14.2151869 C9.74149567,13.9302635 10.2519886,13.9282849 10.6138893,14.209251 L10.7086806,14.2928932 L10.7863869,14.380114 C11.0713103,14.7399219 11.0732889,15.2504148 10.7923228,15.6123155 L10.7086806,15.7071068 L9.415,16.99937 L15.0007869,17 C15.1879145,17 15.3726408,16.9897187 15.5544317,16.96969 L6.34801151,7.76169311 C4.93774047,8.64556341 4,10.2136646 4,12.0007869 C4,12.9193757 4.24775158,13.780099 4.6800791,14.5197812 L4.81525146,14.7379915 C4.93132393,14.9005765 5,15.1008405 5,15.3171446 C5,15.8694294 4.55228475,16.3171446 4,16.3171446 C3.66599922,16.3171446 3.37024338,16.1533986 3.18863074,15.9018049 C2.43832928,14.789868 2,13.4465161 2,12.0007869 C2,9.66271914 3.14641207,7.59241028 4.90778634,6.32131018 L2.29289322,3.70710678 C1.90236893,3.31658249 1.90236893,2.68341751 2.29289322,2.29289322 C2.65337718,1.93240926 3.22060824,1.90467972 3.61289944,2.20970461 Z M20,7.68237835 C20.3191373,7.68237835 20.6033578,7.83187477 20.7864517,8.06465786 L20.8400029,8.13964967 L20.8400029,8.13964967 L20.8568829,8.16657767 C21.5796647,9.26747401 22,10.5850432 22,12.0007869 C22,13.9778591 21.1802685,15.7634727 19.8621409,17.0362924 L18.4470143,15.6223534 C19.4037073,14.7116979 20,13.4258782 20,12.0007869 C20,11.0748671 19.7482782,10.2077401 19.3095348,9.46410619 L19.1723659,9.2447855 C19.0639746,9.08497419 19,8.8911473 19,8.68237835 C19,8.1300936 19.4477153,7.68237835 20,7.68237835 Z M14.6250898,2.21155682 L14.7123106,2.28926319 L17.7175144,5.29446701 C18.0801441,5.65709671 18.1060462,6.2289421 17.7952208,6.62145976 L17.7175144,6.70868057 L14.7123106,9.71388439 C14.3217863,10.1044087 13.6886213,10.1044087 13.298097,9.71388439 C12.9354673,9.35125469 12.9095652,8.7794093 13.2203907,8.38689164 L13.298097,8.29967083 L14.595,7.00136997 L9.826,7.00136997 L7.91134154,5.0856117 C8.18869946,5.04232895 8.47145204,5.01533288 8.75859041,5.00563235 L8.99921311,5.00157379 L14.597,5.00136997 L13.298097,3.70347675 C12.9354673,3.34084705 12.9095652,2.76900166 13.2203907,2.376484 L13.298097,2.28926319 C13.6607267,1.92663349 14.2325721,1.90073137 14.6250898,2.21155682 Z" id="🎨-Color"> </path> </g> </g> </g>
    </svg>`;
    const AutoPlayAll = `
    <svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#000000">
    <g id="SVGRepo_bgCarrier" stroke-width="0"/>
    <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"/>
    <g id="SVGRepo_iconCarrier">
    <g id="🔍-System-Icons" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="ic_fluent_arrow_repeat_all_24_filled" fill="#1C274C" fill-rule="nonzero"> <path d="M20,7.67839023 C20.3191373,7.67839023 20.6033578,7.8277818 20.7864517,8.06040161 L20.7868129,8.0569409 C21.552384,9.17836413 22,10.5338305 22,11.9937699 C22,15.7761413 18.9955544,18.857279 15.2414096,18.9840181 L15.0007869,18.9880738 L9.405,18.9874442 L10.7086806,20.2904605 L10.7863869,20.3776202 C11.0972124,20.7698625 11.0713103,21.3413068 10.7086806,21.7036822 C10.3481966,22.0639133 9.78096555,22.0916234 9.38867434,21.7868124 L9.29446701,21.7036822 L6.28926319,18.7005862 L6.21155682,18.6134265 C5.92663349,18.2538711 5.92465485,17.7437362 6.20562092,17.3820893 L6.28926319,17.2873645 L9.29446701,14.2842685 L9.38168782,14.2066167 C9.74149567,13.9218932 10.2519886,13.9199159 10.6138893,14.2006849 L10.7086806,14.2842685 L10.7863869,14.3714282 C11.0713103,14.7309837 11.0732889,15.2411186 10.7923228,15.6027654 L10.7086806,15.6974902 L9.415,16.988847 L15.0007869,16.9894766 C17.7617761,16.9894766 20,14.7528225 20,11.9937699 C20,10.9755377 19.6951563,10.0284557 19.1716955,9.23868979 C19.0637032,9.07917977 19,8.88586843 19,8.67768884 C19,8.12579146 19.4477153,7.67839023 20,7.67839023 Z M14.6250898,2.21140589 L14.7123106,2.28905775 L17.7175144,5.29215375 C18.0801441,5.6545291 18.1060462,6.22597341 17.7952208,6.61821576 L17.7175144,6.70537539 L14.7123106,9.70847139 C14.3217863,10.0987218 13.6886213,10.0987218 13.298097,9.70847139 C12.9354673,9.34609604 12.9095652,8.77465173 13.2203907,8.38240938 L13.298097,8.29524975 L14.595,6.9978595 L8.99921311,6.99806318 C6.23822395,6.99806318 4,9.23471726 4,11.9937699 C4,12.9117144 4.24775158,13.771834 4.6800791,14.5109974 L4.81525146,14.7290546 C4.93132393,14.8915256 5,15.0916491 5,15.3078015 C5,15.8596989 4.55228475,16.3071002 4,16.3071002 C3.66599922,16.3071002 3.37024338,16.143469 3.18863074,15.8920517 C2.43832928,14.7808948 2,13.4384851 2,11.9937699 C2,8.21139848 5.0044456,5.13026076 8.75859041,5.00352168 L8.99921311,4.99946596 L14.597,4.99926229 L13.298097,3.7022794 C12.9354673,3.33990404 12.9095652,2.76845974 13.2203907,2.37621739 L13.298097,2.28905775 C13.6607267,1.9266824 14.2325721,1.90079845 14.6250898,2.21140589 Z" id="🎨-Color"> </path> </g> </g> </g>
    </svg>`;

    const PlayingListIcon = `
    <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g id="SVGRepo_bgCarrier" stroke-width="0"/>
    <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"/>
    <g id="SVGRepo_iconCarrier"> <path d="M20 11L3 11" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/> <path d="M11 16H3" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/> <path d="M14 18L17.5 15L21 18" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/> <path d="M3 6L13.5 6M20 6L17.75 6" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/> </g>
    </svg>`;

    const animationBtnIcon = `
    <svg fill="#09244B" height="24px" width="24px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512.004 512.004" xml:space="preserve">
    <g id="SVGRepo_bgCarrier" stroke-width="0"/>
    <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"/>
    <g id="SVGRepo_iconCarrier"><title>Animation</title> <g> <g> <path d="M491.243,235.245h-6.919v-102.63c0-11.463-9.294-20.757-20.757-20.757c-11.463,0-20.757,9.294-20.757,20.757v102.63 h-41.514V96.867c0-11.463-9.294-20.757-20.757-20.757c-11.463,0-20.757,9.294-20.757,20.757v138.378H318.27v-76.108 c0-11.463-9.293-20.757-20.757-20.757c-11.463,0-20.757,9.294-20.757,20.757v76.108h-41.514V48.434 c0-11.463-9.293-20.757-20.757-20.757c-11.464,0-20.757,9.294-20.757,20.757v186.811h-41.513V131.461 c0-11.463-9.294-20.757-20.757-20.757s-20.757,9.294-20.757,20.757v103.784H69.189v-62.27c0-11.463-9.294-20.757-20.757-20.757 s-20.757,9.293-20.757,20.757v62.27h-6.919C9.294,235.245,0,244.539,0,256.002s9.294,20.757,20.757,20.757h6.919v62.27 c0,11.463,9.294,20.757,20.757,20.757c11.463,0,20.757-9.294,20.757-20.757v-62.27h41.513v103.784 c0,11.463,9.294,20.757,20.757,20.757s20.757-9.294,20.757-20.757V276.759h41.513V463.57c0,11.463,9.294,20.757,20.757,20.757 c11.463,0,20.757-9.294,20.757-20.757V276.759h41.514v76.108c0,11.463,9.293,20.757,20.757,20.757 c11.463,0,20.757-9.294,20.757-20.757v-76.108h41.514v138.378c0,11.463,9.293,20.757,20.757,20.757S401.3,426.6,401.3,415.137 V276.759h41.514v104.938c0,11.463,9.293,20.757,20.757,20.757s20.757-9.294,20.757-20.757V276.759h6.919 c11.463,0,20.757-9.294,20.757-20.757C512.004,244.539,502.707,235.245,491.243,235.245z"/> </g> </g> </g>
    </svg>`;

    const fullscreen = `
    <svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#000000">
    <g id="SVGRepo_bgCarrier" stroke-width="0"/>
    <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"/>
    <g id="SVGRepo_iconCarrier"> <title>Fullscreen</title> <g id="页面-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="Media" transform="translate(-480.000000, -48.000000)"> <g id="fullscreen_fill" transform="translate(480.000000, 48.000000)"> <path d="M24,0 L24,24 L0,24 L0,0 L24,0 Z M12.5934901,23.257841 L12.5819402,23.2595131 L12.5108777,23.2950439 L12.4918791,23.2987469 L12.4918791,23.2987469 L12.4767152,23.2950439 L12.4056548,23.2595131 C12.3958229,23.2563662 12.3870493,23.2590235 12.3821421,23.2649074 L12.3780323,23.275831 L12.360941,23.7031097 L12.3658947,23.7234994 L12.3769048,23.7357139 L12.4804777,23.8096931 L12.4953491,23.8136134 L12.4953491,23.8136134 L12.5071152,23.8096931 L12.6106902,23.7357139 L12.6232938,23.7196733 L12.6232938,23.7196733 L12.6266527,23.7031097 L12.609561,23.275831 C12.6075724,23.2657013 12.6010112,23.2592993 12.5934901,23.257841 L12.5934901,23.257841 Z M12.8583906,23.1452862 L12.8445485,23.1473072 L12.6598443,23.2396597 L12.6498822,23.2499052 L12.6498822,23.2499052 L12.6471943,23.2611114 L12.6650943,23.6906389 L12.6699349,23.7034178 L12.6699349,23.7034178 L12.678386,23.7104931 L12.8793402,23.8032389 C12.8914285,23.8068999 12.9022333,23.8029875 12.9078286,23.7952264 L12.9118235,23.7811639 L12.8776777,23.1665331 C12.8752882,23.1545897 12.8674102,23.1470016 12.8583906,23.1452862 L12.8583906,23.1452862 Z M12.1430473,23.1473072 C12.1332178,23.1423925 12.1221763,23.1452606 12.1156365,23.1525954 L12.1099173,23.1665331 L12.0757714,23.7811639 C12.0751323,23.7926639 12.0828099,23.8018602 12.0926481,23.8045676 L12.108256,23.8032389 L12.3092106,23.7104931 L12.3186497,23.7024347 L12.3186497,23.7024347 L12.3225043,23.6906389 L12.340401,23.2611114 L12.337245,23.2485176 L12.337245,23.2485176 L12.3277531,23.2396597 L12.1430473,23.1473072 Z" id="MingCute" fill-rule="nonzero"> </path> <path d="M18.5,5.5 L16,5.5 C15.1716,5.5 14.5,4.82843 14.5,4 C14.5,3.17157 15.1716,2.5 16,2.5 L19,2.5 C20.3807,2.5 21.5,3.61929 21.5,5 L21.5,8 C21.5,8.82843 20.8284,9.5 20,9.5 C19.1716,9.5 18.5,8.82843 18.5,8 L18.5,5.5 Z M8,5.5 L5.5,5.5 L5.5,8 C5.5,8.82843 4.82843,9.5 4,9.5 C3.17157,9.5 2.5,8.82843 2.5,8 L2.5,5 C2.5,3.61929 3.61929,2.5 5,2.5 L8,2.5 C8.82843,2.5 9.5,3.17157 9.5,4 C9.5,4.82843 8.82843,5.5 8,5.5 Z M8,18.5 L5.5,18.5 L5.5,16 C5.5,15.1716 4.82843,14.5 4,14.5 C3.17157,14.5 2.5,15.1716 2.5,16 L2.5,19 C2.5,20.3807 3.61929,21.5 5,21.5 L8,21.5 C8.82843,21.5 9.5,20.8284 9.5,20 C9.5,19.1716 8.82843,18.5 8,18.5 Z M16,18.5 L18.5,18.5 L18.5,16 C18.5,15.1716 19.1716,14.5 20,14.5 C20.8284,14.5 21.5,15.1716 21.5,16 L21.5,19 C21.5,20.3807 20.3807,21.5 19,21.5 L16,21.5 C15.1716,21.5 14.5,20.8284 14.5,20 C14.5,19.1716 15.1716,18.5 16,18.5 Z" id="形状" fill="#09244B"> </path> </g> </g> </g> </g>
    </svg>`;

    const fullscreenExit = `
    <svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#000000">
    <g id="SVGRepo_bgCarrier" stroke-width="0"/>
    <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"/>
    <g id="SVGRepo_iconCarrier"> <title>Exit Fullscreen</title> <g id="页面-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="Media" transform="translate(-432.000000, -48.000000)"> <g id="fullscreen_exit_fill" transform="translate(432.000000, 48.000000)"> <path d="M24,0 L24,24 L0,24 L0,0 L24,0 Z M12.5934901,23.257841 L12.5819402,23.2595131 L12.5108777,23.2950439 L12.4918791,23.2987469 L12.4918791,23.2987469 L12.4767152,23.2950439 L12.4056548,23.2595131 C12.3958229,23.2563662 12.3870493,23.2590235 12.3821421,23.2649074 L12.3780323,23.275831 L12.360941,23.7031097 L12.3658947,23.7234994 L12.3769048,23.7357139 L12.4804777,23.8096931 L12.4953491,23.8136134 L12.4953491,23.8136134 L12.5071152,23.8096931 L12.6106902,23.7357139 L12.6232938,23.7196733 L12.6232938,23.7196733 L12.6266527,23.7031097 L12.609561,23.275831 C12.6075724,23.2657013 12.6010112,23.2592993 12.5934901,23.257841 L12.5934901,23.257841 Z M12.8583906,23.1452862 L12.8445485,23.1473072 L12.6598443,23.2396597 L12.6498822,23.2499052 L12.6498822,23.2499052 L12.6471943,23.2611114 L12.6650943,23.6906389 L12.6699349,23.7034178 L12.6699349,23.7034178 L12.678386,23.7104931 L12.8793402,23.8032389 C12.8914285,23.8068999 12.9022333,23.8029875 12.9078286,23.7952264 L12.9118235,23.7811639 L12.8776777,23.1665331 C12.8752882,23.1545897 12.8674102,23.1470016 12.8583906,23.1452862 L12.8583906,23.1452862 Z M12.1430473,23.1473072 C12.1332178,23.1423925 12.1221763,23.1452606 12.1156365,23.1525954 L12.1099173,23.1665331 L12.0757714,23.7811639 C12.0751323,23.7926639 12.0828099,23.8018602 12.0926481,23.8045676 L12.108256,23.8032389 L12.3092106,23.7104931 L12.3186497,23.7024347 L12.3186497,23.7024347 L12.3225043,23.6906389 L12.340401,23.2611114 L12.337245,23.2485176 L12.337245,23.2485176 L12.3277531,23.2396597 L12.1430473,23.1473072 Z" id="MingCute" fill-rule="nonzero"> </path> <path d="M17.5,6.5 L20,6.5 C20.8284,6.5 21.5,7.17157 21.5,8 C21.5,8.82843 20.8284,9.5 20,9.5 L17,9.5 C15.6193,9.5 14.5,8.38071 14.5,7 L14.5,4 C14.5,3.17157 15.1716,2.5 16,2.5 C16.8284,2.5 17.5,3.17157 17.5,4 L17.5,6.5 Z M4,6.5 L6.5,6.5 L6.5,4 C6.5,3.17157 7.17157,2.5 8,2.5 C8.82843,2.5 9.5,3.17157 9.5,4 L9.5,7 C9.5,8.38071 8.38071,9.5 7,9.5 L4,9.5 C3.17157,9.5 2.5,8.82843 2.5,8 C2.5,7.17157 3.17157,6.5 4,6.5 Z M4,17.5 L6.5,17.5 L6.5,20 C6.5,20.8284 7.17157,21.5 8,21.5 C8.82843,21.5 9.5,20.8284 9.5,20 L9.5,17 C9.5,15.6193 8.38071,14.5 7,14.5 L4,14.5 C3.17157,14.5 2.5,15.1716 2.5,16 C2.5,16.8284 3.17157,17.5 4,17.5 Z M20,17.5 L17.5,17.5 L17.5,20 C17.5,20.8284 16.8284,21.5 16,21.5 C15.1716,21.5 14.5,20.8284 14.5,20 L14.5,17 C14.5,15.6193 15.6193,14.5 17,14.5 L20,14.5 C20.8284,14.5 21.5,15.1716 21.5,16 C21.5,16.8284 20.8284,17.5 20,17.5 Z" id="形状" fill="#09244B"> </path> </g> </g> </g> </g>
    </svg>`;

    const SpeakerFullVolIcon = `
    <svg class="volume" fill="#09244B" width="64px" height="64px" viewBox="0 0 36 36" version="1.1" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <g id="SVGRepo_bgCarrier" stroke-width="0"/>
    <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"/>
    <g id="SVGRepo_iconCarrier"> <title>Mute</title> <path class="clr-i-solid clr-i-solid-path-1" d="M23.41,25.25a1,1,0,0,1-.54-1.85,6.21,6.21,0,0,0-.19-10.65,1,1,0,1,1,1-1.73,8.21,8.21,0,0,1,.24,14.06A1,1,0,0,1,23.41,25.25Z"/>
    <path class="clr-i-solid clr-i-solid-path-2" d="M25.62,31.18a1,1,0,0,1-.45-1.89A12.44,12.44,0,0,0,25,6.89a1,1,0,1,1,.87-1.8,14.44,14.44,0,0,1,.24,26A1,1,0,0,1,25.62,31.18Z"/>
    <path class="clr-i-solid clr-i-solid-path-3" d="M18.33,4,9.07,12h-6a1,1,0,0,0-1,1v9.92a1,1,0,0,0,1,1H8.88l9.46,8.24A1,1,0,0,0,20,31.43V4.72A1,1,0,0,0,18.33,4Z"/> <rect x="0" y="0" width="36" height="36" fill-opacity="0"/> </g>
    </svg>`;
    const SpeakerHalfVolIcon = `
    <svg class="volume" fill="#09244B" width="64px" height="64px" viewBox="0 0 36 36" version="1.1" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <g id="SVGRepo_bgCarrier" stroke-width="0"/>
    <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"/>
    <g id="SVGRepo_iconCarrier"> <title>Mute</title> <path class="clr-i-solid clr-i-solid-path-1" d="M23.41,25.11a1,1,0,0,1-.54-1.85,6.21,6.21,0,0,0-.19-10.65,1,1,0,1,1,1-1.73A8.21,8.21,0,0,1,23.94,25,1,1,0,0,1,23.41,25.11Z"/>
    <path class="clr-i-solid clr-i-solid-path-2" d="M18.34,3.87,9,12H3a1,1,0,0,0-1,1V23a1,1,0,0,0,1,1H8.83l9.51,8.3A1,1,0,0,0,20,31.55V4.62A1,1,0,0,0,18.34,3.87Z"/> <rect x="0" y="0" width="36" height="36" fill-opacity="0"/> </g>
    </svg>`;
    const SpeakerMuteIcon = `
    <svg class="volume" fill="#09244B" width="64px" height="64px" viewBox="0 0 36 36" version="1.1" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <g id="SVGRepo_bgCarrier" stroke-width="0"/>
    <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"/>
    <g id="SVGRepo_iconCarrier"> <title>Unmute</title> <path class="clr-i-solid clr-i-solid-path-1" d="M24.87,6.69A12.42,12.42,0,0,1,28.75,26.3l1.42,1.42A14.43,14.43,0,0,0,25.74,4.88a1,1,0,0,0-.87,1.8Z"/>
    <path class="clr-i-solid clr-i-solid-path-2" d="M27.3,27.67h0l-3.84-3.84-.57-.57h0L4.63,5,3.21,6.41,8.8,12H3a1,1,0,0,0-1,1V23a1,1,0,0,0,1,1H8.83l9.51,8.3A1,1,0,0,0,20,31.55V23.2l5.59,5.59c-.17.1-.34.2-.51.29a1,1,0,0,0,.9,1.79c.37-.19.72-.4,1.08-.62l2.14,2.14L30.61,31l-3.25-3.25Z"/>
    <path class="clr-i-solid clr-i-solid-path-3" d="M22.69,12.62A6.27,6.27,0,0,1,25.8,18a6.17,6.17,0,0,1-1.42,3.92l1.42,1.42a8.16,8.16,0,0,0,2-5.34,8.28,8.28,0,0,0-4.1-7.11,1,1,0,1,0-1,1.73Z"/>
    <path class="clr-i-solid clr-i-solid-path-4" d="M20,4.62a1,1,0,0,0-1.66-.75l-6.42,5.6L20,17.54Z"/> <rect x="0" y="0" width="36" height="36" fill-opacity="0"/> </g>
    </svg>`;

    // Insert the SVG into the button
    playButton.innerHTML = play;
    pauseButton.innerHTML = pause;
    prevButton.innerHTML = prev;
    nextButton.innerHTML = next;
    repeatOnebtn.innerHTML = repeatOnenot;
    AutoPlaybtn.innerHTML = AutoPlayAllnot;
    playingListMenu.innerHTML = PlayingListIcon;
    animationBtn.innerHTML = animationBtnIcon;
    fullscreenIcon.innerHTML = fullscreen;
    SpeakerBtn.innerHTML = SpeakerFullVolIcon;
    currentplaying.innerHTML = currentplayingIcon;

    // Function to update the speaker button icon based on mute state and volume
    function updateSpeakerBtnIcon() {
        if (audio.muted || audio.volume === 0) {
            SpeakerBtn.innerHTML = SpeakerMuteIcon; // Update icon to muted
            localStorage.setItem('speakerIcon', 'mute'); // Save icon state
        } else if (audio.volume < 0.5) {
            SpeakerBtn.innerHTML = SpeakerHalfVolIcon; // Update icon to low volume
            localStorage.setItem('speakerIcon', 'half'); // Save icon state
        } else {
            SpeakerBtn.innerHTML = SpeakerFullVolIcon; // Update icon to full volume
            localStorage.setItem('speakerIcon', 'full'); // Save icon state
        }
    }

    // Function to toggle mute/unmute
    function toggleMute() {
        if (audio.muted) {
            audio.muted = false; // Unmute the audio
            showPopupMessage('Audio Unmuted');
        } else {
            audio.muted = true; // Mute the audio
            showPopupMessage('Audio Muted');
        }

        // Save the mute state to localStorage
        localStorage.setItem('audioMuted', audio.muted);

        // Update the button icon based on the new state
        updateSpeakerBtnIcon();
    }

    // Function to initialize the mute state and volume on page load
    function initializeAudioState() {
        const savedMuteState = localStorage.getItem('audioMuted') === 'true';
        const savedVolume = parseFloat(localStorage.getItem('audioVolume')) || 0.5; // Default to 0.5 if not saved

        if (savedVolume) {
            volumeControl.value = savedVolume;
        }

        audio.muted = savedMuteState;
        audio.volume = savedVolume;

        updateSpeakerBtnIcon(); // Update icon based on saved mute state and volume
        updateVolume(); // Set initial volume display based on saved value
    }

    // Initialize the audio and button on page load
    initializeAudioState();

    // Call this function on page load to set the icon correctly
    window.addEventListener('load', initializeAudioState);

    // Add click event listener to the mute button
    SpeakerBtn.addEventListener('click', toggleMute);

    volumeControl.addEventListener('input', () => {
        localStorage.setItem('audioVolume', audio.volume);
        updateSpeakerBtnIcon();
    });

    const musicAnimation = document.getElementById('musicAnimation');
    const fullscreenButton = document.getElementById('fullscreenButton');
    const player = document.getElementById("music");
    const playerAnimation = document.querySelector(".music-playing-bars");

    // Function to update the buttons based on their states
    function updateButtons() {
        // Save button states in local storage
        localStorage.setItem('repeatButton', repeatButton.checked);
        localStorage.setItem('autoPlayButton', autoPlayButton.checked);
        localStorage.setItem('musicAnimation', musicAnimation.checked);

        if (repeatButton.checked) {
            repeatOnebtn.innerHTML = repeatOne; // Set active repeat one
        } else {
            repeatOnebtn.innerHTML = repeatOnenot; // Set inactive repeat one
        }

        if (autoPlayButton.checked) {
            AutoPlaybtn.innerHTML = AutoPlayAll; // Set active autoplay
        } else {
            AutoPlaybtn.innerHTML = AutoPlayAllnot; // Set inactive autoplay
        }

        if (fullscreenButton.checked) {
            fullscreenIcon.innerHTML = fullscreenExit; // Set active autoplay
        } else {
            fullscreenIcon.innerHTML = fullscreen; // Set inactive autoplay
        }

        // Update player class based on audio and animation state
        if (audio.paused) {
            player.classList.add("paused"); // Add paused class if the audio is paused
            playerAnimation.style.visibility = 'hidden';
        } else if (musicAnimation.checked) {
            player.classList.remove("paused"); // Remove paused class if audio is playing and musicAnimation is checked
            playerAnimation.style.visibility = 'visible';
        } else {
            player.classList.add("paused"); // Add paused class if the audio is playing but musicAnimation is not checked
            playerAnimation.style.visibility = 'hidden';
        }
    }

    // Retrieve and apply the saved states from local storage
    repeatButton.checked = localStorage.getItem('repeatButton') === 'true';
    autoPlayButton.checked = localStorage.getItem('autoPlayButton') === 'true';
    musicAnimation.checked = localStorage.getItem('musicAnimation') === 'true';

    // Update the buttons initially
    updateButtons();

    // Optionally, add event listeners if you want to update the buttons when clicked
    repeatButton.addEventListener('change', updateButtons);
    autoPlayButton.addEventListener('change', updateButtons);
    musicAnimation.addEventListener('change', updateButtons);
    fullscreenButton.addEventListener('change', updateButtons);

    function showPopupMessage(message) {
        // Check if there's already a popup message visible and remove it
        const existingPopup = document.querySelector('.popup-message.show');
        if (existingPopup) {
            existingPopup.classList.remove('show');
            setTimeout(() => {
                existingPopup.remove();
            }, 300); // Time for the CSS transition to hide the popup
        }

        const popup = document.createElement('div');
        popup.className = 'popup-message';
        popup.textContent = message;
        document.body.appendChild(popup);

        setTimeout(() => {
            popup.classList.add('show');
        }, 10); // Delay to trigger CSS transition

        setTimeout(() => {
            popup.classList.remove('show');
            setTimeout(() => {
                popup.remove();
            }, 300); // Time for the CSS transition to hide the popup
        }, 2000); // Display for 2 seconds
    }

    repeatButton.addEventListener('change', () => {
        if (repeatButton.checked) {
            showPopupMessage('Repeat One');
        } else {
            showPopupMessage('Repeat One OFF');
        }
    });

    autoPlayButton.addEventListener('change', () => {
        if (autoPlayButton.checked) {
            showPopupMessage('Shuffle ON');
        } else {
            showPopupMessage('Shuffle OFF');
        }
    });

    musicAnimation.addEventListener('change', () => {
        if (musicAnimation.checked) {
            showPopupMessage('Animation ON');
        } else {
            showPopupMessage('Animation OFF');
        }
    });

    fullscreenButton.addEventListener('change', () => {
        if (fullscreenButton.checked) {
            // Request fullscreen
            document.documentElement.requestFullscreen()
            showPopupMessage('Entered Fullscreen');
            fullscreenButton.checked = true; // Reset the checkbox if entering fullscreen fails
        } else {
            // Exit fullscreen
            document.exitFullscreen()
            showPopupMessage('Fullscreen Exited');
            fullscreenButton.checked = false; // Reset the checkbox if exiting fullscreen fails
        }
    });

    // Event listener for fullscreen change (to handle ESC key and other exit methods)
    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement) {
            fullscreenButton.checked = false; // Uncheck the button if fullscreen is exited
            fullscreenIcon.innerHTML = fullscreen; // Set inactive autoplay
            showPopupMessage('Fullscreen Exited');
        }
    });

    const playingListMenuButton = document.getElementById('playingListMenu');
    const playingList = document.querySelector('.playingList');
    const overlay = document.createElement('div');
    overlay.id = 'overlay';
    document.body.appendChild(overlay);

    playingListMenuButton.addEventListener('click', () => {
        playingList.classList.add('visible');
        overlay.style.display = 'block';
    });


    overlay.addEventListener('click', () => {
        playingList.classList.remove('visible');
        overlay.style.display = 'none';
    });

});
