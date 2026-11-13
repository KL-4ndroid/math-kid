import { Component, useLayoutEffect } from 'react';
import { useThree } from '@react-three/fiber';

export function ContextGuard({ onLost }) {
  const { gl } = useThree();
  useLayoutEffect(() => {
    const lost = event => { event.preventDefault(); onLost(); };
    gl.domElement.addEventListener('webglcontextlost', lost);
    gl.domElement.dataset.bakeryContextReady = 'true';
    return () => {
      gl.domElement.removeEventListener('webglcontextlost', lost);
      delete gl.domElement.dataset.bakeryContextReady;
    };
  }, [gl, onLost]);
  return null;
}

export class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError?.(); }
  render() {
    return this.state.failed ? (
      <p role="status">3D 場景暫時無法顯示。可以使用頁面的輔助操作繼續，進度會照常保存。</p>
    ) : this.props.children;
  }
}
