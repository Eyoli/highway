function Voiture(length, velocity, color) {
    this.pos = {};
    this.length = length;
    this.velocity = velocity;
    this.voieCible = null;
    this.voie = null;
    this.color = color;
    
    this.horsLimites = false;
    
    var angleChangementVoie = -Math.PI / 32;
    var cosBeta = Math.cos(angleChangementVoie);
    var sinBeta = Math.sin(angleChangementVoie);
    
    this.advance = function(fps) {
        // On déplace la voiture
        this.pos.x += this.cosAlpha * this.velocity / fps;
        this.pos.y += this.sinAlpha * this.velocity / fps;
        
        var voitureDevant = this.voie.getVoitureDevant(this.pos.x);
        if(voitureDevant) {
            var dVoitureDevant = Math.abs(voitureDevant.pos.x - this.pos.x);
            
            // Si la voiture n'est pas en train de changer de voie
            if(!this.voieCible) {
                if(this.voie.voieGauche && dVoitureDevant < this.width * 2) {
                    // Déclenchement d'un dépassement de la voiture de devant
                    this.voieCible = this.voie.voieGauche;
                    this.voieCible.insererVoiture(this);
                    this.cosAlpha = cosBeta;
                    this.sinAlpha = sinBeta;
                }
            } else {
                var dVoieCible = Math.abs(this.voieCible.posY - this.pos.y);
                
                if(dVoieCible < 1) {
                    // On place correctement la voiture dans la nouvelle voie
                    this.voie = this.voieCible;
                    this.cosAlpha = 1;
                    this.sinAlpha = 0;
                    this.voieCible = null;
                }
            }
            
            // Déclenchement d'un ralentissement si impossible de dépasser et situation de danger
            if(dVoitureDevant < this.width && this.velocity > 0 && voitureDevant.velocity < this.velocity) {
                this.velocity--;
            }
        }
    }
};

function Voie(route) {
    this.voitures = [];
    this.route = route;
    this.voieGauche = null;
    this.voieDroite = null;
    this.posY = 0;
    
    this.getIdVoitureDevant = function(position) {
        var i = 0;
        while(i < this.voitures.length && this.voitures[i].pos.x > position) {
            i++;
        }
        return (i > 0) ? i - 1 : null;
    };
    
    this.getIdVoitureDerriere = function(position) {
        var i = 0;
        while(i < this.voitures.length && this.voitures[i].pos.x > position) {
            i++;
        }
        return (i < this.voitures.length) ? i : null;
    };
    
    this.getVoitureDerriere = function(position) {
        var i = this.getIdVoitureDerriere(position);
        return i == null ? null : this.voitures[i];
    };
    
    this.getVoitureDevant = function(position) {
        var i = this.getIdVoitureDevant(position);
        return i == null ? null : this.voitures[i];
    };
    
    this.ajouterVoiture = function(voiture) {
        voiture.pos.x = 0;
        voiture.voie = this;
        voiture.pos.y = this.posY;
        voiture.cosAlpha = 1;
        voiture.sinAlpha = 0;
        
        this.insererVoiture(voiture);
    };
    
    this.insererVoiture = function(voiture) {
        var i = this.getIdVoitureDevant(voiture.pos.x);
        
        if(i === null) {
            this.voitures.unshift(voiture);
        } else {
            this.voitures.splice(i, 0, voiture);
        }
    };
    
    this.enleverVoitureDevant = function() {
        var voitureAEnlever = this.voitures.shift();
        
        voitureAEnlever.horsLimites = true;
        
        console.log("BOOUM");
    };
    
    this.bouchee = function() {
        return this.voitures.length > 0 && this.voitures[0].pos.x > this.voitures[0].width * 2;
    };
};

function Route(posDebut, posFin, width, nbVoies) {
    this.posDebut = posDebut;
    this.posFin = posFin;
    this.width = width;
    this.voies = [];
    this.voituresVersVoieGauche = [];
    this.voituresVersVoieDroite = [];
    this.largeurVoie = width / nbVoies;
    
    var dx = this.posFin.x - this.posDebut.x;
    var dy = this.posFin.y - this.posDebut.y;
    this.norme = Math.sqrt(dx*dx + dy*dy);
    
    this.sinAlpha = dy / this.norme;
    this.cosAlpha = dx / this.norme;
    
    for(var i = 0; i < nbVoies; i++) {
        this.voies.push(new Voie(this));
    }
    
    for(var i = 0; i < nbVoies; i++) {
        this.voies[i].posY = (i * this.largeurVoie) - (this.width / 2) + (this.largeurVoie / 2);
        if(i > 0) {
            this.voies[i].voieGauche = this.voies[i-1];
        }
        if(i < nbVoies-1) {
            this.voies[i].voieDroit = this.voies[i+1];
        }
    }
    
    this.ajouterVoiture = function(numeroVoie, voiture) {
        voiture.width = this.largeurVoie;
        this.voies[numeroVoie].ajouterVoiture(voiture);
    };
    
    this.enleverVoituresHorsLimites = function(fps) {
        // Déplacement des voitures
        for(var i = 0; i < this.voies.length; i++) {
            var voitureDevant = this.voies[i].voitures[0];
            if(voitureDevant && voitureDevant.pos.x > this.norme) {
                this.voies[i].enleverVoitureDevant();
            }
        }
    };
};

function ServiceDessin(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    
    this.clear = function() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    };
    
    this.dessinerVoiture = function(voiture, route, color) {
        var posX = route.posDebut.x + voiture.pos.x * route.cosAlpha - voiture.pos.y * route.sinAlpha;
        var posY = route.posDebut.y + voiture.pos.x * route.sinAlpha + voiture.pos.y * route.cosAlpha;
        
        this.context.beginPath();
        this.context.fillStyle = color;
        this.context.arc(posX, posY, (voiture.width/ 2) - 3, 0, 2*Math.PI);
        this.context.fill();
        this.context.closePath();
    };
    
    this.dessinerVoie = function(voie, route) {
        // this.context.beginPath();
        // this.context.strokeStyle = '#FFAD34';
        // this.context.moveTo(route.posDebut.x - voie.posY * route.sinAlpha, route.posDebut.y + voie.posY * route.cosAlpha);
        // this.context.lineTo(route.posFin.x - voie.posY * route.sinAlpha, route.posFin.y + voie.posY * route.cosAlpha);
        // this.context.stroke();
        // this.context.closePath();
        
        for(var i = 0; i < voie.voitures.length; i++) {
            this.dessinerVoiture(voie.voitures[i], route, '#FFAD34');
        }
    };
    
    this.dessinerRoute = function(route) {
        
        var semiWidth = route.width / 2;
        
        this.context.beginPath();
        this.context.fillStyle = '#5F5F5F';
        this.context.moveTo(route.posDebut.x - semiWidth * route.sinAlpha, route.posDebut.y + semiWidth * route.cosAlpha);
        this.context.lineTo(route.posFin.x - semiWidth * route.sinAlpha, route.posFin.y + semiWidth * route.cosAlpha);
        this.context.lineTo(route.posFin.x + semiWidth * route.sinAlpha, route.posFin.y - semiWidth * route.cosAlpha);
        this.context.lineTo(route.posDebut.x + semiWidth * route.sinAlpha, route.posDebut.y - semiWidth * route.cosAlpha);
        this.context.fill();
        this.context.closePath();
        
        for(var i = 0; i <= route.voies.length; i++) {
            var fractionWidth = (route.width * i / route.voies.length) - semiWidth;
            this.context.beginPath();
            if(i > -route.voies.length && i < route.voies.length) {
                this.context.setLineDash([5, 15]);
            } else {
                this.context.setLineDash([]);
            }
            
            this.context.strokeStyle = '#FFFFFF';
            this.context.moveTo(route.posDebut.x - fractionWidth * route.sinAlpha, route.posDebut.y + fractionWidth * route.cosAlpha);
            this.context.lineTo(route.posFin.x - fractionWidth * route.sinAlpha, route.posFin.y + fractionWidth * route.cosAlpha);
            this.context.stroke();
            this.context.closePath();
        }
        
        for(var i = 0; i < route.voies.length; i++) {
            this.dessinerVoie(route.voies[i], route);
        }
        
        for(var i = 0; i < route.voituresVersVoieGauche.length; i++) {
            this.dessinerVoiture(route.voituresVersVoieGauche[i], route, '#e52b41');
        }
    };
    
    this.afficherInformations = function(simulateur) {
        this.context.font="14px Verdana";
        this.context.fillStyle = '#000000';
        this.context.fillText("Trafic : " + simulateur.voitures.length, this.canvas.width - 150, 20);
        this.context.fillText("Trafic total : " + simulateur.traficTotal, this.canvas.width - 150, 40);
    }
};

function Simulateur(intervalleGeneration) {
    
    this.routes = [];
    this.routes.push(new Route({x:0,y:0}, {x:1500, y:1000}, 50, 4));
    this.routes.push(new Route({x:0,y:700}, {x:500, y:-100}, 100, 4));
    this.routes.push(new Route({x:500,y:700}, {x:750, y:-100}, 100, 3));
    
    this.voitures = [];
    
    this.traficTotal = 0;
    
    this.intervalleGeneration = intervalleGeneration;
    
    this.generer = function(route) {
        var numeroVoie = Math.floor(Math.random() * route.voies.length);
    };
    
    this.advance = function(fps) {
        var i;
        
        // Génération de nouvelles voitures
        for(i = 0; i < this.routes.length; i++) {
            for(j = 0; j < this.routes[i].voies.length; j++) {
                var p = Math.random();
                if(p < pNouvelleVoiture && !this.routes[i].voies[j].bouchee()) {
                    var voiture = new Voiture(30, Math.random() * 50 + 100, '#FFAD34');
                    this.routes[i].ajouterVoiture(j, voiture);
                    this.voitures.push(voiture);
                    this.traficTotal++;
                }
            }
        }
        
        // Suppression des voitures hors limites
        for(i = 0; i < this.routes.length; i++) {
            this.routes[i].enleverVoituresHorsLimites();
        }
        
        i = 0;
        while(i < this.voitures.length) {
            if(!this.voitures[i].horsLimites) {
                this.voitures[i].advance(fps);
                i++;
            } else {
                this.voitures.splice(i, 1);
            }
        }
    };
};

window.onload = function() {

    var pause = false;
    
    var canvas = document.getElementById('canvas');
    
    var service = new ServiceDessin(canvas);
    
    var simulateur = new Simulateur(0.03);
    
    canvas.addEventListener("click", function(event) {
        pause = !pause;
    });
    
    var expectedFPS = 60;
    
    function generer() {
        simulateur.generer();
    }

    function animate() {
        
        if(!pause) {
            service.clear();
            
            simulateur.advance(expectedFPS);
            
            for(var i = 0; i < simulateur.routes.length; i++) {
                service.dessinerRoute(simulateur.routes[i]);
            }
            
            service.afficherInformations(simulateur);
        }

        window.requestAnimationFrame(animate);
    }
    
    window.requestAnimationFrame(animate);
};