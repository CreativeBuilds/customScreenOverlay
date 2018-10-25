let app = new PIXI.Application({ 
    width: 1920,         // default: 800
    height: 256,        // default: 600
    antialias: true,    // default: false
    transparent: false, // default: false
    resolution: 1       // default: 1
  }
);

document.body.appendChild(app.view);

app.renderer.backgroundColor = 0xf1f1f1