import BlockType from '../../extension-support/block-type';
import ArgumentType from '../../extension-support/argument-type';
import Cast from '../../util/cast';
import log from '../../util/log';
import translations from './translations.json';
import blockIcon from './block-icon.png';


/**
 * Formatter which is used for translation.
 * This will be replaced which is used in the runtime.
 * @param {object} messageData - format-message object
 * @returns {string} - message for the locale
 */
let formatMessage = messageData => messageData.default;

/**
 * Setup format-message for this extension.
 */
const setupTranslations = () => {
    const localeSetup = formatMessage.setup();
    if (localeSetup && localeSetup.translations[localeSetup.locale]) {
        Object.assign(
            localeSetup.translations[localeSetup.locale],
            translations[localeSetup.locale]
        );
    }
};

const EXTENSION_ID = 'foodtech';

/**
 * URL to get this extension as a module.
 * When it was loaded as a module, 'extensionURL' will be replaced a URL which is retrieved from.
 * @type {string}
 */
let extensionURL = 'https://getpa.github.io/xcx-food-tech/dist/foodtech.mjs';

/**
 * Scratch 3.0 blocks for example of Xcratch.
 */
class ExtensionBlocks {
    /**
     * A translation object which is used in this class.
     * @param {FormatObject} formatter - translation object
     */
    static set formatMessage (formatter) {
        formatMessage = formatter;
        if (formatMessage) setupTranslations();
    }

    /**
     * @return {string} - the name of this extension.
     */
    static get EXTENSION_NAME () {
        return formatMessage({
            id: 'foodtech.name',
            default: 'FoodTech',
            description: 'name of the extension'
        });
    }

    /**
     * @return {string} - the ID of this extension.
     */
    static get EXTENSION_ID () {
        return EXTENSION_ID;
    }

    /**
     * URL to get this extension.
     * @type {string}
     */
    static get extensionURL () {
        return extensionURL;
    }

    /**
     * Set URL to get this extension.
     * The extensionURL will be changed to the URL of the loading server.
     * @param {string} url - URL
     */
    static set extensionURL (url) {
        extensionURL = url;
    }

    /**
     * Construct a set of blocks for FoodTech.
     * @param {Runtime} runtime - the Scratch 3.0 runtime.
     */
    constructor (runtime) {
        /**
         * The Scratch 3.0 runtime.
         * @type {Runtime}
         */
        this.runtime = runtime;

        if (runtime.formatMessage) {
            // Replace 'formatMessage' to a formatter which is used in the runtime.
            formatMessage = runtime.formatMessage;
        }

        this.temperature = null;
        setInterval(async ()=>{
            const IPADDRESS = 'http://'+window.location.host+'/esphome/sensor/temperature'; // ここにAPIのエンドポイントを記述
  
            try {
                const response = await fetch(IPADDRESS, {
                method: 'GET', // または 'POST', 'PUT', 'DELETE' など
                headers: {
                    'Content-Type': 'application/json'
                }
                });

                if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json(); // JSONとしてレスポンスを受け取る
                if(data.value)
                    this.temperature = data.value;
            } catch (error) {
                console.error('API呼び出しに失敗しました:', error);
            }
        }, 1000);

        this.prepareTapo().then(()=>console.log("スマートプラグ準備完了"));
    }

    async prepareTapo(){
        const login = 'http://'+window.location.host+'tapo/login';
        const actionBase = 'http://'+window.location.host+'tapo/actions/p110m/'; // ここにAPIのエンドポイントを記述
  
        try {
            const response = await fetch(login, {
                method: 'POST', // または 'POST', 'PUT', 'DELETE' など
                headers: {
                    'Content-Type': 'application/json'
                }, 
                body: '{ "password": "passwd" }'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const sessionId = await response.text(); // JSONとしてレスポンスを受け取る
            
            this.setDeviceStatus = async (status)=>{
                try {
                    const response = await fetch(actionBase+status+"?device=smartplug", {
                        method: 'GET', // または 'POST', 'PUT', 'DELETE' など
                        headers: {
                            'Authorization': 'Bearer ' + sessionId
                        }
                    });
        
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                } catch (error) {
                    console.error('API呼び出しに失敗しました:', error);
                }
            }
        } catch (error) {
            console.error('API呼び出しに失敗しました:', error);
        }
    }

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
        setupTranslations();
        return {
            id: ExtensionBlocks.EXTENSION_ID,
            name: ExtensionBlocks.EXTENSION_NAME,
            extensionURL: ExtensionBlocks.extensionURL,
            blockIconURI: blockIcon,
            showStatusButton: false,
            blocks: [
                {
                    opcode: 'reporter',
                    blockType: BlockType.REPORTER,
                    blockAllThreads: false,
                    text: formatMessage({
                        id: 'foodtech.temp',
                        default: 'temperature',
                        description: 'temperature'
                    }),
                    func: 'getTemperature'
                },
                {
                    opcode: 'turnOn',
                    blockType: BlockType.COMMAND,
                    blockAllThreads: false,
                    text: formatMessage({
                        id: 'foodtech.on',
                        default: 'on',
                        description: 'on'
                    }),
                    func: 'turnOn'
                },
                {
                    opcode: 'turnOff',
                    blockType: BlockType.COMMAND,
                    blockAllThreads: false,
                    text: formatMessage({
                        id: 'foodtech.off',
                        default: 'off',
                        description: 'off'
                    }),
                    func: 'turnOff'
                }
            ],
            menus: {
            }
        };
    }

    getTemperature (args) {
        return this.temperature;
    }

    turnOn(args){
        this.setDeviceStatus("on");
    }

    turnOff(args){
        this.setDeviceStatus("off");
    }

}

export {ExtensionBlocks as default, ExtensionBlocks as blockClass};
