const ApiController = (function () {

    const getSpotifyToken = async () => {
        const result = await fetch ('http://song-finder-x.herokuapp.com/api/spotify', {
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
                    tracks.push(item.track.name);
                });
            }
        });
        return tracks;
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
        const result = await fetch ('http://song-finder-x.herokuapp.com/api/genius', {
            method: 'GET',
            headers: {
                'Search-Term' : searchTerm
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
        },
        apiGenius(searchTerm){
            return apiGenius(searchTerm);
        }
    }
})();

function buttonHandler(){
    let id = document.getElementById("spotifyId").value;
    let lyric = document.getElementById("lyric").value;
    findIntersection(id, lyric);
}

const findIntersection = async (userId, lyric) => {
    console.log("Starting spotify scan");
    let playlistTracks = await ApiController.getAllTracksFromUser(userId);

    console.log("Starting genius search");
    let searchResults = await ApiController.getAllSearchResults(lyric);

    let intersection = [];
    console.log("Starting processing");
    for (let i = 0; i < searchResults.length; i++) {
        if (playlistTracks.includes(searchResults[i]) && !intersection.includes(searchResults[i])) {
            intersection.push(searchResults[i]);
        }
    }
    console.log("done, possible matches:");
    intersection.forEach(song => console.log(song));
}