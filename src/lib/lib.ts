export const generateSet = (n: number, s: number): number[][] => {
    // generate a 2D array
    let set: number[][] = Array.from({ length: n }, (_, i) => []);

    s --;
    let r = 0;

    // 1st card
    for (let i = 0; i <= s; i ++) {
        set[r].push(i);
    }
    
    // s following cards
    for (let i = 0; i < s; i ++) {
        r ++;
        set[r].push(0);
        for (let j = 0; j < s; j ++) {
            set[r].push((s + 1) + s * i + j);
        }
    }

    // last s * s cards
    for (let i = 0; i < s; i ++) {
        for (let j = 0; j < s; j ++) {
            r ++;
            set[r].push(i + 1);
            for (let k = 0; k < s; k ++) {
                set[r].push((s + 1) + s * k + (i * k + j) % s);
            }
        }
    }

    return set;
};

export const deg_to_rad = (deg: number) => {
    const pi = Math.PI;
    return deg * (pi / 180);
};

export const scaleImageToFitCircle = (width: number, height: number, radius: number) => {
    const diameter = radius;

    const scaleFactor = Math.min(diameter / width, diameter / height);

    const newWidth = Math.round(width * scaleFactor);
    const newHeight = Math.round(height * scaleFactor);

    return { newWidth, newHeight };
};
