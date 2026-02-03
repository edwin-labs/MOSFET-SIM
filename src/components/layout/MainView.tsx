import { View3D } from '../views/View3D';
import { View2DFront } from '../views/View2DFront';
import { View2DTop } from '../views/View2DTop';
import { View2DSide } from '../views/View2DSide';
import styles from './MainView.module.css';

export function MainView() {
  return (
    <div className={styles.mainView}>
      <div className={styles.view3d}>
        <View3D />
      </div>
      <div className={styles.view2dContainer}>
        <div className={styles.view2d}>
          <View2DFront />
        </div>
        <div className={styles.view2d}>
          <View2DTop />
        </div>
        <div className={styles.view2d}>
          <View2DSide />
        </div>
      </div>
    </div>
  );
}
