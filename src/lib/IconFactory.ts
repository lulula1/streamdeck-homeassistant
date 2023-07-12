import IconBuilder from './IconBuilder';
import BackgroundLogo from '../assets/background-logo.png';
import HaLightIcon from '../assets/ha-light-icon.png';
import HaLightFill from '../assets/ha-light-fill.png';
import HaMultiLightsIcon from '../assets/ha-multi-lights-icon.png';
import HaMultiLightsFill from '../assets/ha-multi-lights-fill.png';
import HaSwitchOnIcon from '../assets/ha-switch-on-icon.png';
import HaSwitchOffIcon from '../assets/ha-switch-off-icon.png';

class ImageLibrary {
    private static instance: ImageLibrary;

    private icons: Record<string, CanvasImageSource> = {};

    public static getInstance(): ImageLibrary {
        if (!ImageLibrary.instance) {
            ImageLibrary.instance = new ImageLibrary();
        }
        return ImageLibrary.instance;
    }

    public getIcon(data: string): Promise<CanvasImageSource> {
        if (data in this.icons)
            return Promise.resolve(this.icons[data]);
        return IconBuilder.imageDataToImageSource(data)
            .then(source => this.icons[data] = source);
    }
}

export class IconFactory {

    private static imageLibrary: ImageLibrary = ImageLibrary.getInstance();

    private iconVariants = {
        light: [this.createLightIcon.bind(this), this.createMultiLightsIcon.bind(this)],
        switch: [this.createSwitchIcon.bind(this)],
    }

    private width: number;
    private height: number;
    private backgroundColor: string;

    constructor (width: number, height: number, backgroundColor: string) {
        this.width = width;
        this.height = height;
        this.backgroundColor = backgroundColor;
    }

    private async getDefaultBuilder(): Promise<IconBuilder> {
        return new IconBuilder(this.width, this.height)
            .fillColor(this.backgroundColor)
            .fillImage(await IconFactory.imageLibrary.getIcon(BackgroundLogo));
    }

    private async getIconWithMaskedColor(builder: IconBuilder, icon: string, mask: string, color?: string): Promise<IconBuilder> {
        if (color)
            builder.fillMaskWithColor(await IconFactory.imageLibrary.getIcon(mask), color);
        return builder.fillImage(await IconFactory.imageLibrary.getIcon(icon));
    }

    public async createLightIcon(color?: string): Promise<string> {
        const builder = await this.getIconWithMaskedColor(await this.getDefaultBuilder(), HaLightIcon, HaLightFill, color);
        return builder.build();
    }

    public async createMultiLightsIcon(color?: string): Promise<string> {
        const builder = await this.getIconWithMaskedColor(await this.getDefaultBuilder(), HaMultiLightsIcon, HaMultiLightsFill, color);
        return builder.build();
    }

    public async createSwitchIcon(isOn: boolean = false): Promise<string> {
        const builder = await this.getDefaultBuilder();
        builder.fillImage(await IconFactory.imageLibrary.getIcon(isOn ? HaSwitchOnIcon : HaSwitchOffIcon))
        return builder.build();
    }

    public getIconVariantBuilder<T extends keyof typeof this.iconVariants>(domain: T, variant: number): typeof this.iconVariants[T][0] | null {
        return this.iconVariants[domain]?.[variant];
    }

    public getIconVariantLength<T extends keyof typeof this.iconVariants>(domain: T): number {
        return this.iconVariants[domain]?.length || 0;
    }
}
