import type { ControllerMetaData, MetaData } from 'phecda-server'
import { Generator } from 'phecda-server'

export class WSGenerator extends Generator {
  name = 'WS'

  classMap: Record<string, { [key: string]: string }> = {}

  getContent() {
    let content = ''

    for (const name in this.classMap) {
      content += `
        export class ${name}{
            ${Object.values(this.classMap[name]).reduce((p, c) => p + c)}
            }`
    }
    return content
  }

  addMethod(args: ControllerMetaData) {
    const {
      ws, name, func, tag,
    } = args
    if (!ws?.on)
      return
    if (!this.classMap[name])
      this.classMap[name] = {}
    this.classMap[name][func] = `
    ${func}(...args){
return {tag:"${tag}",func:"${func}",args}
    }
    `
  }

  generateCode(meta: MetaData[]): string {
    for (const i of meta) {
      if (i.controller === 'ws')
        this.addMethod(i as ControllerMetaData)
    }
    return this.getContent()
  }
}
