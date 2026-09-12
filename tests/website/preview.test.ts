import {afterEach,describe,it,expect,vi} from 'vitest';
import {validSnapshot} from '../../src/website/snapshot';
const company={id:'company',slug:'tenant',name:'Restaurant',currency:'EGP',about:null,logoUrl:null,coverUrl:null};
afterEach(()=>{vi.unstubAllGlobals();vi.resetModules();});
describe('preview boundary',()=>{
  it('accepts an empty unpublished restaurant and rejects foreign identities or malformed display data',()=>{
    const snapshot={revision:'context',company,branches:[],menu:null};
    expect(validSnapshot(snapshot,'company','tenant')).toBe(true);
    expect(validSnapshot(snapshot,'foreign','tenant')).toBe(false);
    expect(validSnapshot(snapshot,'company','foreign')).toBe(false);
    expect(validSnapshot({...snapshot,company:{...company,name:{html:'unsafe'}}},'company','tenant')).toBe(false);
    expect(validSnapshot({...snapshot,branches:[{companyId:'foreign'}]},'company','tenant')).toBe(false);
    expect(validSnapshot({...snapshot,menu:{sections:[{}]}},'company','tenant')).toBe(false);
  });
  it('latches preview mode and never accesses tokens or permits API requests',async()=>{
    vi.stubGlobal('window',{location:{search:'?builderPreview=true'}});
    const getItem=vi.fn(()=>{throw new Error('Unexpected storage read');});const setItem=vi.fn();const removeItem=vi.fn();
    vi.stubGlobal('localStorage',{getItem,setItem,removeItem});
    const mode=await import('../../src/website/mode');const storage=await import('../../src/utils/tokenStorage');
    expect(storage.getAccessToken()).toBeNull();expect(storage.getRefreshToken()).toBeNull();storage.setTokens({accessToken:'new'});storage.clearTokens();expect(getItem).not.toHaveBeenCalled();expect(setItem).not.toHaveBeenCalled();expect(removeItem).not.toHaveBeenCalled();
    window.location.search='';expect(mode.previewMode).toBe(true);expect(()=>mode.assertLiveRequest()).toThrow('disabled');
  });
});
