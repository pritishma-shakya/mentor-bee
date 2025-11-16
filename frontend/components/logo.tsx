export default function Logo({width, height}:{width: number, height: number}) {
    return (
        <div className="mb-6">
            <img src="/images/mentor-bee-logo.png" width={width} height={height}/>
        </div>
    );
}