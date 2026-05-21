window.onload = function() {
    document.getElementById("timer").addEventListener("mousedown", function(){
        startTimer();
    });
    document.getElementById("timer").addEventListener("mouseup", function(){
        stopTimer();
    })
};

let startTime;

function startTimer() {
    console.log('start timer');
    startTime = Date.now()
}

function stopTimer() {
    console.log('stop timer');
    const seconds = Math.floor((Date.now() - startTime) / 1000);
    injectCell(seconds)
}

function injectCell(seconds) {
    const el = document.createElement('div');
    el.innerText = seconds;
    el.style.width = `${seconds * 16}` + 'px';
    el.style.backgroundColor = getColor(seconds);
    document.getElementById("live").appendChild(el);
}

function getColor(seconds) {
    if (seconds <= 5) { return 'orange'; }
    if (seconds <= 10) { return 'yellow'; }
    if (seconds <= 15) { return 'green'; }
    return 'blue';
}