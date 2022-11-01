import { GfxApp } from '../core/GfxApp';
import { Transform3 } from '../core/Transform3';
import { BoxMesh } from '../geometry/3d/BoxMesh';
import { UnlitMaterial } from '../materials/UnlitMaterial';
import { Color } from '../math/Color';
import { Plane } from '../math/Plane';
import { Ray } from '../math/Ray'
import { Vector2 } from '../math/Vector2';
import { Vector3 } from '../math/Vector3';

export class PositionWidget extends Transform3
{
    public axes: BoxMesh[];

    private deviceCoords: Vector2;
    private currentAxis: number;
    private selectionPoint: Vector3;

    constructor(lineLength = 1, lineWidth = 0.01, triggerDistance = 0.05)
    {
        super();

        this.currentAxis = -1;
        this.deviceCoords = new Vector2();
        this.selectionPoint = new Vector3();

        this.axes = [];
        this.axes.push(new BoxMesh(lineLength, lineWidth, lineWidth));
        this.axes.push(new BoxMesh(lineWidth, lineLength, lineWidth));
        this.axes.push(new BoxMesh(lineWidth, lineWidth, lineLength));

        this.axes[0].position.set(lineLength/2, 0, 0);
        this.axes[1].position.set(0, lineLength/2, 0);
        this.axes[2].position.set(0, 0, lineLength/2);

        this.axes[0].material = new UnlitMaterial();
        this.axes[1].material = new UnlitMaterial();
        this.axes[2].material = new UnlitMaterial();

        this.axes[0].material.setColor(new Color(1, 0, 0));
        this.axes[1].material.setColor(new Color(0, 1, 0));
        this.axes[2].material.setColor(new Color(0, 0, 1));

        this.axes[0].boundingBox.max.y = triggerDistance;
        this.axes[0].boundingBox.max.z = triggerDistance;

        this.axes[1].boundingBox.max.x = triggerDistance;
        this.axes[1].boundingBox.max.z = triggerDistance;

        this.axes[2].boundingBox.max.x = triggerDistance;
        this.axes[2].boundingBox.max.y = triggerDistance;

        this.add(this.axes[0]);
        this.add(this.axes[1]);
        this.add(this.axes[2]);

        window.addEventListener('mousedown', (event: MouseEvent) => {this.onMouseDown(event)});
        window.addEventListener('mouseup', (event: MouseEvent) => {this.onMouseUp(event)});
        window.addEventListener('mousemove', (event: MouseEvent) => {this.onMouseMove(event)});
    }

    update(deltaTime: number): void
    {
        const ray = new Ray();
        ray.setPickRay(this.deviceCoords, GfxApp.getInstance().camera);

        if(this.currentAxis == -1)
        {
            this.axes[0].scale.y = 1;
            this.axes[0].scale.z = 1;

            this.axes[1].scale.x = 1;
            this.axes[1].scale.z = 1;

            this.axes[2].scale.x = 1;
            this.axes[2].scale.y = 1;
            
            if(ray.intersectsOrientedBoundingBox(this.axes[0]))
            {
                this.axes[0].scale.y = 2;
                this.axes[0].scale.z = 2;
            }
            else if(ray.intersectsOrientedBoundingBox(this.axes[1]))
            {
                this.axes[1].scale.x = 2;
                this.axes[1].scale.z = 2;
            }
            else if(ray.intersectsOrientedBoundingBox(this.axes[2]))
            {
                this.axes[2].scale.x = 2;
                this.axes[2].scale.y = 2;
            }
        }
        else if(this.currentAxis == 0)
        {
            const [worldPosition, worldRotation, worldScale] = GfxApp.getInstance().camera.worldMatrix.decompose();
            const projectedPosition = ray.intersectsPlane(new Plane(Vector3.ZERO, new Vector3(0, worldPosition.y, worldPosition.z)));
            if(projectedPosition)
            {
                this.translateX(projectedPosition.x - this.selectionPoint.x);
                this.selectionPoint = projectedPosition;
            }
        }
        else if(this.currentAxis == 1)
        {
            const [worldPosition, worldRotation, worldScale] = GfxApp.getInstance().camera.worldMatrix.decompose();
            const projectedPosition = ray.intersectsPlane(new Plane(Vector3.ZERO, new Vector3(worldPosition.x, 0, worldPosition.z)));
            if(projectedPosition)
            {
                this.translateY(projectedPosition.y - this.selectionPoint.y);
                this.selectionPoint = projectedPosition;
            }
        }
        else if(this.currentAxis == 2)
        {
            const [worldPosition, worldRotation, worldScale] = GfxApp.getInstance().camera.worldMatrix.decompose();
            const projectedPosition = ray.intersectsPlane(new Plane(Vector3.ZERO, new Vector3(worldPosition.x, worldPosition.y, 0)));
            if(projectedPosition)
            {
                this.translateZ(projectedPosition.z - this.selectionPoint.z);
                this.selectionPoint = projectedPosition;
            }
        }
    }

    onMouseDown(event: MouseEvent): void 
    {
        this.deviceCoords = GfxApp.getInstance().getNormalizedDeviceCoordinates(event.x, event.y);

        const ray = new Ray();
        ray.setPickRay( this.deviceCoords, GfxApp.getInstance().camera);

        if(this.currentAxis == -1)
        {
            if(ray.intersectsOrientedBoundingBox(this.axes[0]))
            {
                const [worldPosition, worldRotation, worldScale] = GfxApp.getInstance().camera.worldMatrix.decompose();
                const projectedPosition = ray.intersectsPlane(new Plane(Vector3.ZERO, new Vector3(0, worldPosition.y, worldPosition.z)));

                if(projectedPosition)
                {
                    this.selectionPoint = projectedPosition;
                    this.currentAxis = 0;
                }

                return;
            }

            if(ray.intersectsOrientedBoundingBox(this.axes[1]))
            {
                const [worldPosition, worldRotation, worldScale] = GfxApp.getInstance().camera.worldMatrix.decompose();

                const projectedPosition = ray.intersectsPlane(new Plane(Vector3.ZERO, new Vector3(worldPosition.x, 0, worldPosition.z)));
                if(projectedPosition)
                {
                    this.selectionPoint = projectedPosition;
                    this.currentAxis = 1;
                }

                return;
            }

            if(ray.intersectsOrientedBoundingBox(this.axes[2]))
            {
                const [worldPosition, worldRotation, worldScale] = GfxApp.getInstance().camera.worldMatrix.decompose();
                const projectedPosition = ray.intersectsPlane(new Plane(Vector3.ZERO, new Vector3(worldPosition.x, worldPosition.y, 0)));

                if(projectedPosition)
                {
                    this.selectionPoint = projectedPosition;
                    this.currentAxis = 2;
                }

                return;
            }
        }
    }

    onMouseUp(event: MouseEvent): void
    {
        this.currentAxis = -1;
    }
    
    onMouseMove(event: MouseEvent): void
    {
        this.deviceCoords = GfxApp.getInstance().getNormalizedDeviceCoordinates(event.x, event.y);
    }

    isSelected(): boolean
    {
        return this.currentAxis >= 0;
    }
}