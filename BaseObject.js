export default class BaseObject {
  constructor(id, type) {
    this.id = id;
    this.type = type;
  }
}

export const ObjectTypes = {
  PATH: 'PATH',
  SECTION: 'SECTION',
  STORE_SHELF: 'STORE_SHELF'
};

export const ObjectSVGConfigs = {
  PATH_ID: 'path',
  SECTION_ID: 'section',
  STORE_SHELF_ID: 'store-shelf'
};
