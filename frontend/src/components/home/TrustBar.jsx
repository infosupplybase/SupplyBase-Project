import Icon from '../ui/Icon';
import { trustPoints } from '../../data/siteConfig';

export default function TrustBar() {
  return (
    <div className="trustbar-wrap">
      <div className="container">
        <div className="trustbar">
          {trustPoints.map((point) => (
            <div className="trust-item" key={point.title}>
              <Icon name={point.icon} size={30} strokeWidth={1.4} />
              <div>
                <strong>{point.title}</strong>
                <span>{point.text}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
