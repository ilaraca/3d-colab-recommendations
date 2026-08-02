'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three-stdlib';
import { Loader2 } from 'lucide-react';

interface ThreeSceneProps {
  url: string;
}

export default function ThreeScene({ url }: ThreeSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationId = 0;
    let disposed = false;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#f8f9fa');

    const camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 4);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    let mesh: THREE.Mesh | null = null;

    const loader = new STLLoader();
    loader.load(
      url,
      (geometry) => {
        if (disposed) {
          geometry.dispose();
          return;
        }

        geometry.center();
        geometry.computeBoundingSphere();
        const radius = geometry.boundingSphere?.radius || 1;
        geometry.scale(1 / radius, 1 / radius, 1 / radius);

        const material = new THREE.MeshStandardMaterial({
          color: '#3b82f6',
          roughness: 0.5,
          metalness: 0.4,
        });

        mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        setLoading(false);

        const animate = () => {
          if (disposed) return;
          animationId = requestAnimationFrame(animate);
          if (mesh) mesh.rotation.y += 0.008;
          renderer.render(scene, camera);
        };
        animate();
      },
      undefined,
      () => {
        if (!disposed) {
          setError('Não foi possível carregar o modelo 3D.');
          setLoading(false);
        }
      }
    );

    const handleResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      disposed = true;
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);

      if (mesh) {
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          mesh.material.dispose();
        }
        scene.remove(mesh);
      }

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [url]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[300px] bg-[#f8f9fa]"
    >
      {loading && !error && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-muted/80">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Carregando modelo 3D…</span>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted px-4 text-center text-sm text-muted-foreground">
          {error}
        </div>
      )}
    </div>
  );
}
