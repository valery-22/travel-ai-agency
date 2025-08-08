interface InfoPillProps {
    text: string;
    image?: string;
}

const InfoPill = ({ text, image }: InfoPillProps) => {
    return (
        <figure className="info-pill">
            {image && <img src={image} alt={text} />}
            <figcaption>{text}</figcaption>
        </figure>
    );
};

export default InfoPill;
