'use client';

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { STLLoader } from 'three-stdlib';

interface ThreeSceneProps {
  url: string;
}

export default function ThreeScene({ url }: ThreeSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#f8f9fa');

    const camera = new THREE.PerspectiveCamera(
      50,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 4);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Load STL
    const loader = new STLLoader();
    loader.load(url, (geometry) => {
      geometry.center();
      geometry.computeBoundingSphere();
      const scale = 1 / (geometry.boundingSphere?.radius || 1);
      geometry.scale(scale, scale, scale);

      const material = new THREE.MeshStandardMaterial({
        color: '#3b82f6',
        roughness: 0.5,
        metalness: 0.5,
      });

      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      // Auto-rotate the mesh
      const animate = () => {
        requestAnimationFrame(animate);
        mesh.rotation.y += 0.01;
        renderer.render(scene, camera);
      };
      animate();
    });

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [url]);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: '100%', 
        height: '100%', 
        minHeight: '300px',
        background: '#f8f9fa'
      }} 
    />
  );
} 