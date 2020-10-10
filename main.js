const ApiController = (function () {

    const getSpotifyToken = async () => {
        const result = await fetch('https://song-finder-x.herokuapp.com/api/spotify', {
            method: 'GET'
        });
        const data = await result.json();
        return data;
    }

    const getPlaylists = async (token, userId) => {

        const result = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        const data = await result.json();
        let ids = [];
        data.items.forEach(playlist => ids.push(playlist.id));
        return ids;
    }

    const getTracksAllPlaylists = async (token, playlistIds) => {
        let tracks = [];
        playlistIds.forEach(async id => {
            let data = await getTracks(token, id, "");
            data.items.forEach(item => {
                tracks.push(item.track.name);
            });
            while (data.next !== null) {
                let next = data.next;
                let pagination = next.substring(next.lastIndexOf('?'), next.length);
                data = await getTracks(token, id, pagination);
                data.items.forEach(item => {
                    tracks.push(formatTrackName(item.track.name));
                });
            }
        });
        return tracks;
    }

    const formatTrackName = (trackName) => {
        let dashIndex = trackName.indexOf('-');
        if (dashIndex != -1 && trackName.charAt(dashIndex - 1) == " ") {
            trackName = trackName.substring(0, dashIndex - 1);
        }
        return trackName;
    }

    const getTracks = async (token, playlistId, pagination) => {
        const result = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks` + pagination, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        const data = await result.json();
        return data;
    }

    const _getAllTracksFromUser = async (userId) => {
        const token = await getSpotifyToken();
        const playlistIds = await getPlaylists(token, userId);
        const tracks = await getTracksAllPlaylists(token, playlistIds);
        return tracks;
    }

    const _getAllSearchResults = async (searchTerm) => {
        const result = await fetch('https://song-finder-x.herokuapp.com/api/genius', {
            method: 'GET',
            headers: {
                'Search-Term': searchTerm
            }
        });
        const data = await result.json();
        return data;
    }

    return {
        getAllTracksFromUser(userId) {
            return _getAllTracksFromUser(userId);
        },
        getAllSearchResults(searchTerm) {
            return _getAllSearchResults(searchTerm, 0);
        }
    }
})();

function buttonHandler() {
    let id = document.getElementById("spotifyId").value;
    let lyric = document.getElementById("lyric").value;
    findSong(id, lyric);
}

const findSong = async (userId, lyric) => {
    clearResult();
    document.getElementById("loading").innerHTML = "Waiting on spotify";
    let playlistTracks = await ApiController.getAllTracksFromUser(userId);

    document.getElementById("loading").innerHTML = "Waiting on genius";
    let searchResults = await ApiController.getAllSearchResults(lyric);

    let intersection = [];
    document.getElementById("loading").innerHTML = "Processing results";
    for (let i = 0; i < playlistTracks.length; i++){
        if(searchResults.includes(ignoreSymbols(playlistTracks[i])) && !intersection.includes(playlistTracks[i])){
            intersection.unshift(playlistTracks[i]);
        }
    }
    document.getElementById("loading").innerHTML = "Possible results";
    displayResult(intersection);
    
}

const displayResult = (results) => {
    results.forEach(song => {
        let result = document.createElement('P');
        result.innerText = song;
        result.className = "result";
        document.body.appendChild(result);
    });
}

const clearResult = () => {
    let resultElements = document.querySelectorAll("p.result");
    if(resultElements.length > 0){
        for(let element of resultElements){
            element.remove();
        }
    }
}

const ignoreSymbols = (trackName) => {
    let lastIndex = trackName.indexOf(')');
    if(lastIndex != -1){
        let res = trackName.substring(trackName.indexOf('(') - 1, lastIndex + 1);
        trackName = trackName.replace(res, "");
        if(trackName.charAt(0) == " "){
            trackName = trackName.substring(1, trackName.length + 1);
        }
    }
    return trackName;
}