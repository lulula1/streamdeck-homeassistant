export default class IconBuilder {
    private readonly canvas: HTMLCanvasElement;
    private readonly ctx: CanvasRenderingContext2D;

    constructor(private width: number, private height: number) {
        this.canvas = document.createElement('canvas');
        if (!this.canvas) throw new Error("Failed to create environment to create icon");
        this.ctx = this.canvas.getContext('2d')!;
        if (!this.ctx) throw new Error("Failed to create environment to create icon");
        this.canvas.width = width;
        this.canvas.height = height;
    }

    private setConfig(config: object): this {
        Object.entries(config).map(([key, value]) => (this.ctx as any)[key] = value);
        return this;
    }

    fillColor(color: string): this {
        if (color) {
            const savedColor = this.ctx.fillStyle;
            this.ctx.fillStyle = color;
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = savedColor;
        }
        return this;
    }

    fillImage(image: CanvasImageSource): this {
        return this.drawImage(image, 0, 0, this.width, this.height);
    }

    /**
     * Image pixels will be overriden with the provided color
     * Transparent pixels won't be colored
     */
    fillMaskWithColor(mask: CanvasImageSource, color: string): this {
        return this.fillImage(new IconBuilder(this.width, this.height)
            .fillColor(color)
            .setConfig({ globalCompositeOperation: 'destination-in' })
            .fillImage(mask).canvas);
    }
    
    /**
     * Image pixels will be overriden with the provided image
     * Transparent pixels won't be colored
     */
    fillMaskWithImage(mask: CanvasImageSource, image: CanvasImageSource): this {
        return this.fillImage(new IconBuilder(this.width, this.height)
            .fillImage(image)
            .setConfig({ globalCompositeOperation: 'destination-in' })
            .fillImage(mask).canvas);
    }

    drawImage(image: CanvasImageSource, x: number, y: number, w: number, h: number): this {
        if (image)
            this.ctx.drawImage(image, x, y, w, h);
        return this;
    }

    build(): string {
        return this.canvas.toDataURL();
    }

    static imageDataToImageSource(image: string): Promise<CanvasImageSource> {
        return new Promise((res) => {
            const imageElement = new Image();
            imageElement.onload = res.bind(this, imageElement);
            imageElement.src = image;
        })
    }
}
