const App = {

    //Videos to which the settings are applied
    videos: null,

    //The target which the user is possibly hovering
    hovering: null,

    //The amount of posts visible
    postContainers: 0,

    /**
     * Change local videos variable to currently loaded videos
     */
    updateVideos: function() {
        this.videos = document.querySelectorAll("video");
    },

    /**
     * Check if there's more posts visible than we have previously detected
     * Apply filters if there's any new posts
     */
    checkForUpdate() {
        let postContainers = document.querySelector("#list-view-2").childNodes.length;

        if (postContainers > this.postContainers) {
            this.postContainers = postContainers;
            this.filterPosts();
        }

    },

    /**
     * Return the "genre" of a given post
     * @param post Html element whose genre we want
     * @param thumbnail Is the element a thumbnail (or list view)
     * @returns {string} genre
     */
    getGenre(post, thumbnail = false) {
        return thumbnail ? post.closest("a").textContent.trim() : post.querySelector(".section").textContent.trim()
    },

    /**
     * Filter the posts
     */
    filterPosts() {
        let posts = document.querySelectorAll("article");

        this.getFilters()
            .then(filters => {
                posts.forEach(post => {
                    if ((post.querySelector(".section") && filters.includes(this.getGenre(post)) || post.id === "")) {
                        post.remove();
                    }
                });
            }).catch(err => alert("Error: " + err));

        this.initGenreList();
    },

    /**
     *
     * @param item
     * @returns {*}
     */
    getStorage(item = null) {
        return item !== null ? browser.storage.local.get([item]) : browser.storage.local.get(item);
    },

    addFilter(genre) {
        this.getFilters()
            .then(filters => {
                if (filters.indexOf(genre) === -1) {
                    this.setStorageByKey("filters", filters.concat(genre))
                        .then(() => this.filterPosts());
                } else {
                    this.removeFilter(genre);
                }
                this.filterPosts();
            })
    },

    removeFilter(genre) {
        this.getFilters()
            .then(filters => {
                this.setStorageByKey("filters", filters.filter(filter => filter !== genre))
                    .then(() => this.filterPosts());
            });
    },

    getFilters() {
        return new Promise(resolve => {
            this.getStorage("filters")
                .then(storage => {
                    resolve(Array.isArray(storage.filters) ? storage.filters : [])
                })
            .catch(error => alert("Error: " + error));
        });
    },

    initGenreList() {

        let thumbnails = document.querySelectorAll(".thumbnail");

        thumbnails.forEach(thumbnail => {
            this.genreIsFiltered(this.getGenre(thumbnail, true)).then(result => thumbnail.style.opacity = result ? 0.15 : 1.0);
        });

    },

    toggleRemoveIcon(element, mode = null) {
        let links = [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/OOjs_UI_icon_lock-ltr.svg/1024px-OOjs_UI_icon_lock-ltr.svg.png",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Unlock_icon.svg/1024px-Unlock_icon.svg.png"
        ];

        let genre = this.getGenre(element, true);

        if(mode === null) {
            this.genreIsFiltered(genre).then(filtered => element.firstChild.src = links[Number(filtered)]);
        } else {
            element.firstChild.src = links[Number(mode)];
        }
    },

    initFilters() {

        let self = this;
        let thumbnails = document.querySelectorAll(".thumbnail");

        thumbnails.forEach(thumbnail => {

            let genre = thumbnail.closest("a").textContent.trim();

            thumbnail.addEventListener("click", function(event) {

                if(self.hovering !== null) {
                    event.preventDefault();
                    event.stopPropagation();
                    self.addFilter.call(self, genre);
                    return false;
                }
            });

            thumbnail.addEventListener("mouseenter", function() {
                if(self.hovering === null) {
                    self.hovering = this.firstChild.src;
                    setTimeout(() => {
                        if (self.hovering === this.firstChild.src) {
                            self.toggleRemoveIcon(this)
                        }
                    }, 250)
                }
            });

            thumbnail.addEventListener("mouseleave", function() {
                this.firstChild.src = self.hovering;
                self.hovering = null;
                self.initGenreList();
            });

        });

    },

    genreIsFiltered(genre) {
        return new Promise(resolve => {
            this.getFilters()
                .then(filters => {
                    resolve(filters.includes(genre));
                });
        });
    },

    volumeController: {
        changeVolume: function(volume, mute = false) {
            App.updateVideos();
            App.videos.forEach(video => {
                video.volume = mute ? 0 : volume/100;
            });
        }
    },

    videoController: {
        updateControls: function(mode) {
            App.updateVideos();
            App.videos.forEach(function(video) {
                if(!mode && video.hasAttribute("controls")) {
                    video.removeAttribute("controls");
                } else if(mode && !video.hasAttribute("controls")) {
                    video.setAttribute("controls", "controls");
                }
            });
        }
    },

    setStorage: function(settings) {
        browser.storage.local.set({
            "volume": settings.volume,
            "mute": settings.mute,
            "controls": settings.controls
        });
        //this.getStorage().then(x => console.log(x));
    },

    setStorageByKey(key, value) {
        console.log(key, value);
        return new Promise((resolve = null) => {
            this.getStorage()
                .then(storage => {
                    storage[key] = value;
                    browser.storage.local.set(storage);
                    console.log("Setting: ", storage);
                    resolve !== null && resolve();
                });
        });
    },

    initPlayerSettings() {
        browser.storage.local.get(["volume", "controls", "mute"]).then(function(settings) {
            App.volumeController.changeVolume(settings.volume, settings.mute);
            App.videoController.updateControls(settings.controls)
        });
    },

    initObserver() {
        let self = this;
        let target = document.querySelector("#list-view-2");
        if(target) {
            let newPostObserver = new MutationObserver(function() {
                try {
                    console.log("Observed post update!");
                    self.checkForUpdate();
                    self.initPlayerSettings();
                } catch(err) {
                    alert(err);
                }
            });
            newPostObserver.observe(
                target,
                { childList: true }
            );
        }
    },

    init: function() {

        console.log(this);

        try {
            this.initFilters();
            this.initGenreList();
            this.initPlayerSettings();
            this.filterPosts();
            this.initObserver();
        } catch(err) {
            alert(err);
        }

    }
};

browser.runtime.onMessage.addListener(function(message) {
    App.volumeController.changeVolume(message.volume, message.mute);
    App.videoController.updateControls(message.controls);
    App.setStorage(message);
});

App.init();