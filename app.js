// configuration for map
const mapData = {
    minX: 1,
    maxX: 14,
    minY: 4,
    maxY: 12,
    blockedSpaces: {
        "7x4": true,
        "1x11": true,
        "12x10": true,
        "4x7": true,
        "5x7": true,
        "6x7": true,
        "8x6": true,
        "9x6": true,
        "10x6": true,
        "7x9": true,
        "8x9": true,
        "9x9": true,
    },
};


// Options for Player Colors... these are in the same order as our sprite sheet
const playerColors = ["blue", "pink", "red", "yellow", "green", "purple"];

// Misc Helpers 
function randomFromArray(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function getKeyString(x, y) {
    return `${x}x${y}`;
}

function createName() {
    const prefix = randomFromArray([
        "COOL",
        "SUPER",
        "CUTE",
        "RANDOM",
        "COOL",
        "SILKY",
        "GOOD",
        "SAFE",
        "DEAR",
        "LORD",
        "WARM",
        "RICH",
        "DARK"
    ]);
    const animal = randomFromArray([
        "BEAR",
        "DOG",
        "CAT",
        "WOLF",
        "LAMB",
        "LION",
        "HIPPO",
        "GOAT",
        "ONION",
        "PIG",
        "HUMAN",
        "FISH",
        "Chicken",
        "BIRD"
    ]);
    return `${prefix} ${animal}`;
}

function isSolid(x, y) {
    const blockedNextSpace = mapData.blockedSpaces[getKeyString(x, y)];
    return (
        blockedNextSpace ||
        x >= mapData.maxX ||
        x < mapData.minX ||
        y >= mapData.maxY ||
        y < mapData.minY
    )
}

(function () {

    let playerId;
    let playerRef;
    // players is the local data of player
    let players = {};
    let playerElements = {};

    function handleArrowPress(xChange = 0, yChange = 0) {
        const newX = players[playerId].x + xChange;
        const newY = players[playerId].y + yChange;
        if (!isSolid(newX, newY)) {
            // move to the next space
            players[playerId].x = newX;
            players[playerId].y = newY;
            if (xChange === 1) {
                players[playerId].direction = "right";
            }
            if (xChange === -1) {
                players[playerId].direction = "left";
            }
            playerRef.set(players[playerId]);
        }
    }

    function initGame() {

        new KeyPressListener("ArrowUp", () => handleArrowPress(0, -1))
        new KeyPressListener("ArrowDown", () => handleArrowPress(0, 1))
        new KeyPressListener("ArrowLeft", () => handleArrowPress(-1, 0))
        new KeyPressListener("ArrowRight", () => handleArrowPress(1, 0))

        const allPlayersRef = firebase.database().ref('players');
        const allCoinsRef = firebase.database().ref('coins');

        const gameContainer = document.querySelector(".game-container");

        // callback when value of players changes (when player join or leave)
        allPlayersRef.on("value", (snapshot) => {
            // fires whenever a change occurs
            players = snapshot.val() || {};
            Object.keys(players).forEach((key) => {
                const characterState = players[key];
                let el = playerElements[key];
                // Now update the DOM
                el.querySelector(".Character_name").innerHTML = characterState.name;
                el.querySelector(".Character_coins").innerHTML = characterState.coins;
                el.setAttribute("data-color", characterState.color);
                el.setAttribute("data-direction", characterState.direction);
                const left = 16 * characterState.x + "px";
                const top = 16 * characterState.y - 4 + "px";
                el.style.transform = `translate3d(${left}, ${top}, 0)`;
            })
        })

        allPlayersRef.on("child_added", (snapshot) => {
            // fires whenever a new node is added the tree
            const addedPlayer = snapshot.val();
            const characterElement = document.createElement("div");
            characterElement.classList.add("Character", 'grid-cell');
            if (addedPlayer.id === playerId) {
                characterElement.classList.add("you");
            }
            characterElement.innerHTML = (`
                <div class="Character_shadow grid-cell"></div>
                <div class="Character_sprite grid-cell"></div>
                <div class="Character_name-container">
                <span class="Character_name"></span>
                <span class="Character_coins">0</span>
                </div>
                <div class="Character_you-arrow"></div>
            `);

            playerElements[addedPlayer.id] = characterElement;

            // Fill in some initial state
            characterElement.querySelector(".Character_name").innerHTML = addedPlayer.name;
            characterElement.querySelector(".Character_coins").innerHTML = addedPlayer.coins;
            characterElement.setAttribute("data-direction", addedPlayer.direction);
            characterElement.setAttribute("data-color", addedPlayer.color);
            const left = 16 * addedPlayer.x + "px";
            const top = 16 * addedPlayer.y - 4 + "px";
            characterElement.style.transform = `translate3d(${left}, ${top}, 0)`;
            gameContainer.appendChild(characterElement);
        })
        // Remove character DOM element after they leave
        allPlayersRef.on("child_removed", (snapshot) => {
            const removeKey = snapshot.val().id;
            gameContainer.removeChild(playerElements[removeKey]);
            delete playerElements[removeKey];
        })
    }

    const name = createName();

    firebase.auth().onAuthStateChanged((user) => {
        console.log(user);
        if (user) {
            // you are logged in!
            playerId = user.uid;
            playerRef = firebase.database().ref(`players/${playerId}`);

            playerRef.set({
                id: playerId,
                name,
                direction: "right",
                color: randomFromArray(playerColors),
                x: 3,
                y: 10,
                coins: 0,
            })

            //Remove player from Firebase when they disconnect
            playerRef.onDisconnect().remove();

            //Begin the game
            initGame();
        } else {
            // you are logged out.
        }
    })

    firebase.auth().signInAnonymously().catch((error) => {
        var errorCode = error.code;
        var errorMessage = error.message;
        // ...
        console.log(errorCode, errorMessage);
    });
})();