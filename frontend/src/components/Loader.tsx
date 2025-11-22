import '../styles/Loader.css';

interface LoaderProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  fullscreen?: boolean;
}

export function Loader({ size = 'medium', text, fullscreen = false }: LoaderProps) {
  if (fullscreen) {
    return (
      <div className="loader-overlay">
        <div className="loader-container">
          <div className={`loader loader-${size}`}>
            <div className="spinner"></div>
          </div>
          {text && <p className="loader-text">{text}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="loader-container">
      <div className={`loader loader-${size}`}>
        <div className="spinner"></div>
      </div>
      {text && <p className="loader-text">{text}</p>}
    </div>
  );
}
