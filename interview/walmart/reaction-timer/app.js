let status = 'idle';
let startTime, reactionTime, gameTimeout;

window.onload = function(){
    let game = document.getElementById('game');
    document.getElementById("start").addEventListener('mousedown', function(){
        status = 'started';
        
        game.style.backgroundColor = '#999';
        game.style.color = '#FFF';
        game.innerHTML = 'Wait ... ';

        const changeTime = 2000 + Math.random() * 300;

        startTime = Date.now();

        gameTimeout = setTimeout(function(){
            status = 'switched';
            game.style.backgroundColor = 'green';
            game.innerHTML = 'Click now!';
        }, changeTime);
    });
    game.addEventListener('click', function(){
        if (status !== 'idle'){
            reactionTime = Date.now() - startTime;
            if (status === 'switched') {
                game.backgroundColor = 'blue';
                game.innerHTML = 'Reaction time: ' + reactionTime + 'ms';
            } else if (status === 'started') {
                clearTimeout(gameTimeout);
                game.innerHTML = 'Too soon!';
                status = 'idle';
            }
        }
    });
}