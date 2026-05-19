let startTiime = null;


function startTimer() {
    console.log('start timer');
    startTiime = Date.now();
}

function stopTimer() {
    console.log('stop timer');

    let seconds = Math.floor((Date.now() - startTiime) / 1000);
    console.log('seconds: ' + seconds, 'color: ' + calculateColor(seconds));

    injectSecondsContainer(seconds);
}

function calculateColor(seconds) {
    if (seconds <= 5) { return 'orange';}
    if (seconds <= 10) { return 'yellow';}
    if (seconds <= 15) { return 'green';}
    return 'blue';
}

function injectSecondsContainer(seconds) {
    let el = document.createElement('div');
    el.innerText = `${seconds}`;
    el.style.backgroundColor = calculateColor(seconds);
    el.style.width = 
    document.getElementById('live').appendChild(el);
}


window.onload = function() {
    document.getElementById("timer").addEventListener("mousedown", function() { startTimer(); });
    document.getElementById("timer").addEventListener("mouseup", function() { stopTimer(); });
}