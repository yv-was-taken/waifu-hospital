import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { createCharacter } from '../features/characters/characterSlice';
import { setAlert } from '../features/alerts/alertSlice';
import { generateCharacterImage } from '../utils/aiApi';
import Spinner from '../components/layout/Spinner';
import styled from 'styled-components';

const CreatorContainer = styled.div`
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: 1.5rem;
  color: var(--primary-color);
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.8rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 1rem;

  &:focus {
    border-color: var(--primary-color);
    outline: none;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.8rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;

  &:focus {
    border-color: var(--primary-color);
    outline: none;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.8rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 1rem;
  background-color: white;

  &:focus {
    border-color: var(--primary-color);
    outline: none;
  }
`;

const TagInput = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const Tag = styled.div`
  background-color: var(--light-bg);
  color: var(--text-color);
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
`;

const RemoveTag = styled.span`
  margin-left: 0.5rem;
  cursor: pointer;
  font-weight: bold;
  color: var(--light-text);

  &:hover {
    color: var(--error-color);
  }
`;

const AddTagInput = styled.div`
  display: flex;
  margin-top: 0.5rem;
`;

const TagButton = styled.button`
  background-color: var(--secondary-color);
  color: white;
  border: none;
  border-radius: 0 4px 4px 0;
  padding: 0 1rem;
  cursor: pointer;

  &:hover {
    background-color: var(--secondary-dark);
  }
`;

const Checkbox = styled.div`
  display: flex;
  align-items: center;
  margin-top: 0.5rem;
`;

const CheckboxInput = styled.input`
  margin-right: 0.5rem;
`;

const ImagePreview = styled.div`
  margin-top: 1rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 1rem;
  text-align: center;
`;

const PreviewImage = styled.img`
  max-width: 100%;
  max-height: 300px;
  border-radius: 4px;
`;

const ImageLoader = styled.div`
  height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--light-text);
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 2rem;
`;

const Button = styled.button`
  background-color: ${props => props.secondary === 'true' ? 'transparent' : 'var(--primary-color)'};
  color: ${props => props.secondary === 'true' ? 'var(--primary-color)' : 'white'};
  border: ${props => props.secondary === 'true' ? '1px solid var(--primary-color)' : 'none'};
  padding: 0.8rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: ${props => props.secondary === 'true' ? 'rgba(255, 107, 129, 0.1)' : 'var(--primary-dark)'};
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: var(--error-color);
  font-size: 0.9rem;
  margin-top: 0.3rem;
`;

const CharacterCreator = () => {
  const [formData, setFormData] = useState({
    name: '',
    imageUrl: '',
    style: 'anime',
    description: '',
    personality: '',
    background: '',
    interests: [],
    occupation: '',
    age: '',
    public: true
  });

  const [currentInterest, setCurrentInterest] = useState('');
  const [generatingImage, setGeneratingImage] = useState(false);
  const [errors, setErrors] = useState({});

  const { loading } = useSelector(state => state.character);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { 
    name, 
    imageUrl, 
    style, 
    description, 
    personality, 
    background, 
    interests, 
    occupation, 
    age, 
    public: isPublic 
  } = formData;

  const onChange = e => {
    const { name, value, type, checked } = e.target;
    
    // For checkbox inputs, use the checked property
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }

    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const addInterest = () => {
    if (currentInterest.trim() !== '' && !interests.includes(currentInterest.trim())) {
      setFormData({
        ...formData,
        interests: [...interests, currentInterest.trim()]
      });
      setCurrentInterest('');
    }
  };

  const removeInterest = (index) => {
    setFormData({
      ...formData,
      interests: interests.filter((_, i) => i !== index)
    });
  };

  const handleInterestKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addInterest();
    }
  };

  const handleGenerateImage = async () => {
    // Validate required fields for image generation
    const requiredFields = { name, description, personality };
    const missingFields = {};
    let hasMissingFields = false;
    
    Object.entries(requiredFields).forEach(([field, value]) => {
      if (!value) {
        missingFields[field] = `Please provide ${field} first`;
        hasMissingFields = true;
      }
    });
    
    if (hasMissingFields) {
      setErrors({ ...errors, ...missingFields });
      dispatch(setAlert({
        msg: 'Please fill in name, description, and personality before generating an image',
        type: 'error'
      }));
      return;
    }

    setGeneratingImage(true);
    
    try {
      // Call the AI service to generate an image
      const imageUrl = await generateCharacterImage({
        description,
        personality,
        style
      });

      setFormData({
        ...formData,
        imageUrl
      });
      
      dispatch(setAlert({
        msg: 'Image generated successfully!',
        type: 'success'
      }));
    } catch (error) {
      console.error('Image generation error:', error);
      dispatch(setAlert({
        msg: 'Failed to generate image. Please try again.',
        type: 'error'
      }));
      
      // Use a placeholder image as fallback
      const placeholderImages = {
        anime: 'https://i.pinimg.com/736x/a1/1a/c5/a11ac53d6c37a8f3ed2cf9afbe9e5e0a.jpg',
        retro: 'https://i.pinimg.com/564x/0a/53/c2/0a53c2a681df11c0e2f70d80a9a6c289.jpg',
        gothic: 'https://i.pinimg.com/564x/8e/0d/57/8e0d5790a4644ab4c93c5f3b953fcc0c.jpg',
        neocyber: 'https://i.pinimg.com/564x/bd/57/a3/bd57a33e4ee9e67671b8c7ff6b75cda1.jpg',
        fantasy: 'https://i.pinimg.com/564x/c3/0c/13/c30c1320b64f4a13e1046b2d7b5c4a7a.jpg',
        'sci-fi': 'https://i.pinimg.com/564x/a1/52/10/a15210aa82e5385bd190c0e2dd0a9281.jpg',
        chibi: 'https://i.pinimg.com/564x/b5/86/80/b58680b0d06c752b0d3f3e6e5ea47c04.jpg'
      };

      setFormData({
        ...formData,
        imageUrl: placeholderImages[style] || placeholderImages.anime
      });
    } finally {
      setGeneratingImage(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!name) newErrors.name = 'Name is required';
    if (!imageUrl) newErrors.imageUrl = 'Image is required';
    if (!description) newErrors.description = 'Description is required';
    if (!personality) newErrors.personality = 'Personality is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveCharacter = (e) => {
    if (e) e.preventDefault();
    
    if (validateForm()) {
      const characterData = { 
        ...formData,
        age: age !== '' ? Number(age) : undefined
      };
      
      dispatch(createCharacter(characterData))
        .unwrap()
        .then(character => {
          dispatch(setAlert({
            msg: 'Character created successfully!',
            type: 'success'
          }));
          navigate(`/characters/${character._id}`);
        })
        .catch(err => {
          dispatch(setAlert({
            msg: err || 'Failed to create character',
            type: 'error'
          }));
        });
    } else {
      dispatch(setAlert({
        msg: 'Please fill in all required fields',
        type: 'error'
      }));
    }
  };
  
  const onSubmit = e => {
    e.preventDefault();
    saveCharacter();
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <CreatorContainer>
      <Title>Create Character</Title>
      <Form onSubmit={onSubmit}>
        <FormGroup>
          <Label htmlFor="name">Name *</Label>
          <Input
            type="text"
            name="name"
            id="name"
            value={name}
            onChange={onChange}
          />
          {errors.name && <ErrorMessage>{errors.name}</ErrorMessage>}
        </FormGroup>

        <FormGroup>
          <Label htmlFor="style">Style *</Label>
          <Select
            name="style"
            id="style"
            value={style}
            onChange={onChange}
          >
            <option value="anime">Anime</option>
            <option value="retro">Retro</option>
            <option value="gothic">Gothic</option>
            <option value="neocyber">Neocyber</option>
            <option value="fantasy">Fantasy</option>
            <option value="sci-fi">Sci-Fi</option>
            <option value="chibi">Chibi</option>
          </Select>
        </FormGroup>

        <FormGroup>
          <Label htmlFor="description">Description *</Label>
          <TextArea
            name="description"
            id="description"
            value={description}
            onChange={onChange}
            placeholder="A brief description of your character..."
          ></TextArea>
          {errors.description && <ErrorMessage>{errors.description}</ErrorMessage>}
        </FormGroup>

        <FormGroup>
          <Label htmlFor="personality">Personality *</Label>
          <TextArea
            name="personality"
            id="personality"
            value={personality}
            onChange={onChange}
            placeholder="Describe your character's personality traits..."
          ></TextArea>
          {errors.personality && <ErrorMessage>{errors.personality}</ErrorMessage>}
        </FormGroup>

        <FormGroup>
          <Label>Character Image *</Label>
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              Fill in name, description, and personality above before generating an image.
            </p>
            <Button 
              type="button" 
              onClick={handleGenerateImage}
              disabled={generatingImage || !name || !description || !personality}
            >
              Generate Image Based on Description
            </Button>
          </div>
          <ImagePreview>
            {imageUrl ? (
              <PreviewImage src={imageUrl} alt={name} />
            ) : generatingImage ? (
              <ImageLoader>
                <div className="spinner"></div>
                <p>Generating image based on your description...</p>
              </ImageLoader>
            ) : (
              <ImageLoader>
                <p>No image generated yet. Fill in character details first.</p>
              </ImageLoader>
            )}
          </ImagePreview>
          {errors.imageUrl && <ErrorMessage>{errors.imageUrl}</ErrorMessage>}
        </FormGroup>

        <FormGroup>
          <Label htmlFor="background">Background</Label>
          <TextArea
            name="background"
            id="background"
            value={background}
            onChange={onChange}
            placeholder="Background story for your character (optional)..."
          ></TextArea>
        </FormGroup>

        <FormGroup>
          <Label htmlFor="occupation">Occupation</Label>
          <Input
            type="text"
            name="occupation"
            id="occupation"
            value={occupation}
            onChange={onChange}
            placeholder="Character's job or role (optional)"
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="age">Age</Label>
          <Input
            type="number"
            name="age"
            id="age"
            value={age}
            onChange={onChange}
            min="0"
            placeholder="Character's age (optional)"
          />
        </FormGroup>

        <FormGroup>
          <Label>Interests</Label>
          <AddTagInput>
            <Input
              type="text"
              value={currentInterest}
              onChange={(e) => setCurrentInterest(e.target.value)}
              onKeyDown={handleInterestKeyDown}
              placeholder="Add interests and press Enter"
              style={{ borderRadius: '4px 0 0 4px' }}
            />
            <TagButton type="button" onClick={addInterest}>Add</TagButton>
          </AddTagInput>
          <TagInput>
            {interests.map((interest, index) => (
              <Tag key={index}>
                {interest}
                <RemoveTag onClick={() => removeInterest(index)}>×</RemoveTag>
              </Tag>
            ))}
          </TagInput>
        </FormGroup>

        <FormGroup>
          <Checkbox>
            <CheckboxInput
              type="checkbox"
              name="public"
              id="public"
              checked={isPublic}
              onChange={onChange}
            />
            <Label htmlFor="public" style={{ margin: 0 }}>
              Make this character public
            </Label>
          </Checkbox>
        </FormGroup>

        <ButtonGroup>
          <Button type="button" secondary="true" onClick={() => navigate('/dashboard')}>
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={saveCharacter}
          >
            Create Character
          </Button>
        </ButtonGroup>
      </Form>
    </CreatorContainer>
  );
};

export default CharacterCreator;
