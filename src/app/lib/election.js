const crypto = require('crypto');

class ElGamal { 

    constructor(){
        this.p = crypto.generatePrimeSync(64, {bigint: true}); 
        this.g = BigInt(2); 
        this.x = crypto.randomInt();
        this.h = modPow(g, x, p);
    }

    static modPow(base, exponent, modulus) {
        if (modulus === BigInt(1)) return BigInt(0);
        let result = BigInt(1);
        base = base % modulus;
        while (exponent > BigInt(0)) {
            if (exponent % BigInt(2) === BigInt(1)) {
            result = (result * base) % modulus;
            }
            exponent = exponent >> BigInt(1);
            base = (base * base) % modulus;
        }
        return result;
    }

    static invMod(a, m){
        let [old_r, r] = [BigInt(a), BigInt(m)];
        let [old_s, s] = [BigInt(1), BigInt(0)];
        
        while (r !== BigInt(0)) {
            const quotient = old_r / r;
            [old_r, r] = [r, old_r - quotient * r];
            [old_s, s] = [s, old_s - quotient * s];
        }
        
        return (old_s + m) % m;
    }

    static randomBigInt(max) {
        return BigInt(Math.floor(Math.random() * Number(max)));
      }

    encrypt(msg) {
        const m = BigInt(msg); 

        const alpha = crypto.randomInt();
        const x1 = modPow(this.g, alpha, this.p);
        const s = crypto.randomInt(); 
        const y1 = modPow(x1, s, this.p) * m;

        return (x1, y1);
    }
}

class ElectionSystem { 

    constructor(candidateIDs, voterIDs, threshold){ 
        this.candidates = new Map();
        candidateIDs.array.forEach(id => {
            this.candidates.set(id, 0)
        });
        this.voters = new Map(); 
        voterIDs.array.forEach(id => {
            this.voters.set(id, false)
        });
        this.numAuthorities = array.length(voterIDs); 
        this.threshold = threshold; 

        this.board = new Map();

        this.crypto = new ElGamal();
    }

    vote(candidateID, voterID){ 
        let vote = this.crypto.encrypt(candidateID);
    }

}

class Voter {

    constructor (id, vote = null) {
        this.id = id; 
        this.vote = vote;
    }

    proveValidVote(publicKey){ 
        const {p, g, h} = publicKey; 


    }
}




class Authority {


}