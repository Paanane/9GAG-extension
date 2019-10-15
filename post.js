const postController = {

    header: null,

    fixPosition: function() {
        try {
            this.header = document.querySelector(".post-page > header");
            this.header.style.height = "107px";
        } catch(err) {
            alert(err);
        }
    }

};

postController.fixPosition();