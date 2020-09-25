import RpgCommonMap  from '../../common/Map'
import { isBrowser } from '../../common/Utils'
import path from 'path'
import tmx from '../parser/tmx'

export class RpgMap extends RpgCommonMap {

    public events: any
    public id: any
    public file: any 
    public _events: any[] = []

    constructor(private server: any) {
        super()
    }

    async load() {
        if (RpgCommonMap.buffer.has(this.id)) {
            return 
        }
        const data = await this.parseFile() 
        super.load(data) 
        RpgCommonMap.buffer.set(this.id, this)
        this.server.createRoom(this.id)
        this._events = this.createEvents('sync')
        this.onLoad()
    }

    get game() {
        return this.server.gameEngine
    }

    onLoad() {}

    createEvents(type, player?) {
        const events: any[] = []

        for (let [event, tileX, tileY] of this.events) {

            if (event.syncAll == false && type == 'sync') {
                continue
            }
            if (event.syncAll == true && type == 'nosync') {
                continue
            }

            const ev = this.game.addEvent(event, event.syncAll)
            
            ev.map = this.id
            
            ev.setPosition({ tileX, tileY })
            ev.speed = 1

            /*const customEvent  = new event()
            customEvent.object = ev
            ev.instance = customEvent*/

            if (event.syncAll == true) {
                this.server.assignObjectToRoom(ev, this.id)
            }
            else {
               // customEvent.object.player = player
               // customEvent.object.server = this
            }

            if (ev.onInit && event.syncAll) {
                ev.execMethod('onInit', [player])
            }

            events.push(ev)     
        }

        return events
    }

    parseFile() {
        const parse = (content) => {
            return new Promise((resolve, reject) => { 
                tmx.parseFile(content, (err, map) => {
                    if (err) return reject(err)
                    resolve(map)
                })
            })
        }

        let filename = this.file

        if (isBrowser()) {
            return fetch('/maps/' + path.basename(filename, '.tmx') + '.json')
                .then(res => res.json())
        }
        
        return parse(filename)
    }
}