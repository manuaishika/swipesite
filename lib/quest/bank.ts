/**
 * Hand-written question bank for the niche quests. Each track has three levels, each level two
 * lessons of five questions. Format per question: [question, four options, index of the right one,
 * one-line explanation]. Options are shuffled when shown, so the right answer's position here
 * doesn't matter. Keep questions about settled, widely taught facts; cite the paper when a
 * question is about a specific result.
 */

export type Q = [string, [string, string, string, string], 0 | 1 | 2 | 3, string]
export type Lesson = { id: string; title: string; topics: string[]; q: Q[] }
export type Level = { lessons: Lesson[] }
export type Track = { id: string; name: string; emoji: string; codes: string[]; levels: [Level, Level, Level] }

export const LEVEL_NAMES = ['Beginner', 'Intermediate', 'Advanced'] as const

const ml: Track = {
  id: 'ml',
  name: 'Machine Learning',
  emoji: '🧮',
  codes: ['cs.LG', 'stat.ML', 'cs.NE'],
  levels: [
    {
      lessons: [
        {
          id: 'ml-b1',
          title: 'Learning from data',
          topics: ['overfitting', 'gradient descent'],
          q: [
            ['A model scores 99% on its training data and 60% on new data. What is happening?', ['Overfitting', 'Underfitting', 'Data augmentation', 'Regularisation'], 0, 'It memorised the training set instead of learning patterns that generalise.'],
            ['What is a validation set for?', ['Choosing hyperparameters without touching the test set', 'Adding more training data', 'Reporting the final score', 'Labelling the data'], 0, 'The test set stays untouched so the final score is honest.'],
            ['Which of these is unsupervised learning?', ['Clustering customers by behaviour', 'Predicting house prices from labelled sales', 'Classifying emails as spam using labels', 'Translating with paired sentences'], 0, 'Clustering finds structure without labels.'],
            ['Gradient descent updates parameters…', ['in the direction that lowers the loss most steeply', 'at random until the loss drops', 'only once per dataset', 'in the direction that raises the loss'], 0, 'It steps along the negative gradient of the loss.'],
            ['The training loss jumps around and grows. Most likely cause?', ['Learning rate too high', 'Learning rate too low', 'Too much test data', 'Too few classes'], 0, 'Steps that are too large overshoot the minimum.'],
          ],
        },
        {
          id: 'ml-b2',
          title: 'Models and metrics',
          topics: ['class imbalance', 'regularization'],
          q: [
            ['99% of transactions are legitimate. Why is accuracy a poor metric for fraud detection?', ['Predicting "legit" always scores 99%', 'Accuracy cannot be computed for two classes', 'It ignores the training set', 'It only works for regression'], 0, 'Use precision, recall or F1 when classes are imbalanced.'],
            ['Logistic regression turns a score into a probability with…', ['the sigmoid function', 'a decision tree', 'k-means', 'a convolution'], 0, 'The sigmoid squashes any number into the range 0–1.'],
            ['L2 regularisation…', ['penalises large weights to reduce overfitting', 'adds more layers', 'removes outliers from the data', 'increases the learning rate'], 0, 'Adding the squared weights to the loss keeps the model simpler.'],
            ['A deep network with no non-linear activations is equivalent to…', ['a single linear model', 'a decision tree', 'a much more powerful model', 'a random guesser'], 0, 'Stacked linear layers collapse into one linear map.'],
            ['Why keep the test set untouched until the end?', ['For an unbiased estimate of performance on new data', 'Because it is too large to load', 'To speed up training', 'So the model can memorise it later'], 0, 'Tuning on it would leak information and inflate the score.'],
          ],
        },
      ],
    },
    {
      lessons: [
        {
          id: 'ml-i1',
          title: 'Training deep networks',
          topics: ['residual connections', 'batch normalization'],
          q: [
            ['Dropout works by…', ['randomly zeroing some activations during training', 'deleting layers after training', 'lowering the learning rate', 'removing training examples'], 0, 'It stops units from co-adapting, which reduces overfitting.'],
            ['Deep networks with sigmoid activations often train slowly because of…', ['vanishing gradients', 'too much data', 'exploding batch sizes', 'label noise'], 0, 'Sigmoid derivatives are small, so gradients shrink layer by layer.'],
            ['A residual connection computes…', ['y = x + F(x)', 'y = F(x) × 0', 'y = F(F(x))', 'y = x / F(x)'], 0, 'Adding the input back lets gradients flow through very deep networks.'],
            ['What does Adam adapt during training?', ['A separate step size for each parameter', 'The number of layers', 'The training labels', 'The batch order'], 0, 'It scales updates using running estimates of gradient moments.'],
            ['Batch normalisation normalises…', ['layer inputs using statistics of the mini-batch', 'the training labels', 'the learning rate', 'the final predictions only'], 0, 'It keeps activations in a stable range, which speeds up training.'],
          ],
        },
        {
          id: 'ml-i2',
          title: 'Generalisation and evaluation',
          topics: ['data leakage', 'double descent'],
          q: [
            ['A model with high variance tends to…', ['overfit', 'underfit', 'ignore the data', 'train faster'], 0, 'High variance means it is very sensitive to the particular training set.'],
            ['k-fold cross-validation…', ['averages performance over k different train/validation splits', 'trains k different architectures at once', 'uses k test sets for the final score', 'repeats one split k times'], 0, 'It gives a steadier estimate when data is limited.'],
            ['Which is data leakage?', ['Scaling features with statistics computed on train + test together', 'Using a validation set', 'Shuffling the training set', 'Using dropout'], 0, 'Test information reached training, so scores look better than they are.'],
            ['Early stopping means…', ['stopping when validation loss stops improving', 'stopping after one epoch', 'stopping when training loss is zero', 'stopping when the GPU is full'], 0, 'It is a cheap and effective form of regularisation.'],
            ['"Double descent" describes test error that…', ['falls again as models grow past the point of fitting the training data exactly', 'always rises with model size', 'falls twice as fast with dropout', 'is twice the training error'], 0, 'Shown by Belkin et al. (2019) and Nakkiran et al. (2019).'],
          ],
        },
      ],
    },
    {
      lessons: [
        {
          id: 'ml-a1',
          title: 'Scaling and theory',
          topics: ['scaling laws', 'grokking'],
          q: [
            ['Chinchilla (Hoffmann et al., 2022) found that for a fixed compute budget you should…', ['scale model size and training tokens roughly equally', 'only make the model bigger', 'only add more data', 'train for fewer steps'], 0, 'Many earlier large models were under-trained for their size.'],
            ['The neural tangent kernel describes training in the limit of…', ['infinite width', 'infinite depth with no width', 'zero learning rate and finite width', 'a single neuron'], 0, 'At infinite width, gradient descent behaves like a fixed kernel method.'],
            ['"Grokking" is when a network…', ['suddenly generalises long after fitting the training set', 'forgets its training data', 'stops training early', 'learns only from labels'], 0, 'Reported by Power et al. (2022) on small algorithmic tasks.'],
            ['The lottery ticket hypothesis says dense networks contain…', ['sparse subnetworks that train to similar accuracy on their own', 'random weights that never change', 'exactly one optimal neuron', 'no redundant weights'], 0, 'Frankle & Carbin (2019).'],
            ['Sharpness-aware minimisation looks for…', ['flat minima, which tend to generalise better', 'the sharpest minimum available', 'the largest learning rate', 'saddle points'], 0, 'It minimises the worst-case loss in a small neighbourhood of the weights.'],
          ],
        },
        {
          id: 'ml-a2',
          title: 'Modern methods',
          topics: ['diffusion models', 'mixture of experts'],
          q: [
            ['Diffusion models generate data by…', ['learning to reverse a gradual noising process', 'pitting two networks against each other', 'copying training examples', 'searching a database'], 0, 'They start from noise and denoise step by step.'],
            ['Contrastive learning methods like SimCLR…', ['pull together two views of the same example and push apart others', 'need labels for every example', 'only work on text', 'minimise reconstruction error'], 0, 'The augmentations define what counts as "the same".'],
            ['A mixture-of-experts layer…', ['routes each token to a few of many expert networks', 'averages all experts for every token', 'uses one expert per layer', 'removes the attention layers'], 0, 'More parameters at similar compute per token.'],
            ['Covariate shift is when…', ['the input distribution changes but p(y|x) stays the same', 'the labels are wrong', 'the model weights change after training', 'the learning rate drifts'], 0, 'A common form of distribution shift between training and deployment.'],
            ['A model is well calibrated when…', ['its confidence matches how often it is right', 'it is always confident', 'its accuracy is 100%', 'it never abstains'], 0, 'Expected calibration error (ECE) measures the gap.'],
          ],
        },
      ],
    },
  ],
}

const nlp: Track = {
  id: 'nlp',
  name: 'Language & NLP',
  emoji: '💬',
  codes: ['cs.CL'],
  levels: [
    {
      lessons: [
        {
          id: 'nlp-b1',
          title: 'Words to numbers',
          topics: ['tokenization', 'word embeddings'],
          q: [
            ['Byte-pair encoding builds a vocabulary by…', ['repeatedly merging the most frequent pair of symbols', 'listing every word in a dictionary', 'using one token per character only', 'random hashing'], 0, 'It yields subwords, so rare words still get tokens.'],
            ['Word embeddings like word2vec place words close together when they…', ['appear in similar contexts', 'start with the same letter', 'have the same length', 'are translations of each other'], 0, '"You shall know a word by the company it keeps."'],
            ['A language model, at its core…', ['assigns probabilities to sequences of tokens', 'translates between any two languages', 'checks grammar rules', 'stores a dictionary'], 0, 'Most predict the next token given the previous ones.'],
            ['For perplexity, lower is…', ['better', 'worse', 'meaningless', 'only valid for translation'], 0, 'It is the exponential of the average negative log-likelihood.'],
            ['Named entity recognition finds…', ['people, places and organisations in text', 'the sentiment of a review', 'the next word', 'spelling mistakes'], 0, 'A classic sequence-labelling task.'],
          ],
        },
        {
          id: 'nlp-b2',
          title: 'Transformer basics',
          topics: ['attention mechanism', 'fine-tuning'],
          q: [
            ['Which paper introduced the Transformer?', ['Attention Is All You Need (2017)', 'ImageNet Classification with Deep CNNs (2012)', 'Playing Atari with Deep RL (2013)', 'Generative Adversarial Nets (2014)'], 0, 'Vaswani et al., 2017.'],
            ['Attention lets each token…', ['weigh information from other tokens', 'skip the network', 'see only the token before it', 'change its own spelling'], 0, 'Weights come from similarity between queries and keys.'],
            ['BERT is pre-trained mainly by…', ['predicting masked tokens', 'predicting the next token only', 'translating sentences', 'classifying images'], 0, 'Masked language modelling on an encoder.'],
            ['A context window is…', ['the maximum number of tokens the model can attend to at once', 'the GUI the model runs in', 'its training time', 'the size of its vocabulary'], 0, 'Anything beyond it is invisible to the model.'],
            ['Fine-tuning means…', ['further training a pre-trained model on task-specific data', 'training from scratch', 'only changing the prompt', 'deleting layers'], 0, 'It adapts general knowledge to a task.'],
          ],
        },
      ],
    },
    {
      lessons: [
        {
          id: 'nlp-i1',
          title: 'Inside the transformer',
          topics: ['positional encoding', 'kv cache'],
          q: [
            ['Standard self-attention cost grows with sequence length n as…', ['n²', 'n', 'log n', 'it does not grow'], 0, 'Every token attends to every other token.'],
            ['Why do transformers need positional information?', ['Attention by itself ignores token order', 'To save memory', 'To tokenise text', 'Because of dropout'], 0, 'Without it, a sentence and its shuffle look the same.'],
            ['Multi-head attention…', ['runs several attention operations with different projections in parallel', 'uses several models at once', 'attends only to the first token', 'is only for images'], 0, 'Different heads can track different relationships.'],
            ['The KV cache speeds up generation by…', ['storing keys and values of earlier tokens', 'compressing the vocabulary', 'skipping attention', 'caching the final answer'], 0, 'Earlier tokens are not recomputed for every new one.'],
            ['Raising the sampling temperature makes outputs…', ['more random', 'more deterministic', 'shorter', 'always grammatical'], 0, 'It flattens the probability distribution.'],
          ],
        },
        {
          id: 'nlp-i2',
          title: 'Working with LLMs',
          topics: ['in-context learning', 'retrieval augmented generation'],
          q: [
            ['In-context learning is when a model…', ['does a task from examples in the prompt, without updating weights', 'is retrained on each prompt', 'reads its training data again', 'copies the examples verbatim'], 0, 'Described at scale in the GPT-3 paper (Brown et al., 2020).'],
            ['Chain-of-thought prompting…', ['asks for intermediate reasoning steps', 'chains several models together', 'shortens the answer', 'removes the system prompt'], 0, 'It helps on multi-step problems (Wei et al., 2022).'],
            ['Retrieval-augmented generation…', ['adds retrieved documents to the prompt', 'retrains the model nightly', 'deletes old knowledge', 'only works offline'], 0, 'It grounds answers in sources the model can cite.'],
            ['In RLHF, the reward model is trained on…', ['human comparisons between responses', 'the pre-training corpus', 'random numbers', 'test-set labels'], 0, 'The policy is then optimised against it, often with PPO.'],
            ['LoRA fine-tunes a model by…', ['training small low-rank matrices while freezing the base weights', 'retraining every weight', 'pruning half the layers', 'changing the tokenizer'], 0, 'Hu et al., 2021: far fewer trainable parameters.'],
          ],
        },
      ],
    },
    {
      lessons: [
        {
          id: 'nlp-a1',
          title: 'Alignment and evaluation',
          topics: ['direct preference optimization', 'benchmark contamination'],
          q: [
            ['DPO differs from classic RLHF because it…', ['optimises directly on preference pairs, without a separate reward model or RL loop', 'needs no human preferences', 'only works for images', 'uses a larger reward model'], 0, 'Rafailov et al., 2023.'],
            ['Benchmark contamination means…', ['test questions appeared in the training data', 'the benchmark has typos', 'the model refused to answer', 'two benchmarks overlap in topic'], 0, 'Scores then overstate real ability.'],
            ['Sycophancy in language models is…', ['tailoring answers to agree with the user’s stated views', 'refusing harmful requests', 'answering too briefly', 'translating poorly'], 0, 'It gets worse with some kinds of preference training.'],
            ['Constitutional AI uses…', ['written principles and AI feedback to critique and revise outputs', 'a legal constitution as training data', 'only human labels', 'no training at all'], 0, 'Bai et al., 2022.'],
            ['A hallucination is…', ['fluent content that isn’t supported by facts or sources', 'any long answer', 'a refusal', 'a tokenisation error'], 0, 'A core reliability problem for LLMs.'],
          ],
        },
        {
          id: 'nlp-a2',
          title: 'Interpretability of language models',
          topics: ['induction heads', 'sparse autoencoders'],
          q: [
            ['Induction heads complete patterns like…', ['… A B … A → B', 'A → A', 'reversing a sentence', 'counting tokens'], 0, 'Linked to in-context learning (Olsson et al., 2022).'],
            ['A linear probe that decodes a property from hidden states shows…', ['the information is there, not that the model uses it', 'the model uses it for every output', 'the model is safe', 'nothing at all'], 0, 'Decodable is not the same as causally used.'],
            ['Superposition is when a model…', ['represents more features than it has dimensions', 'uses one neuron per feature', 'stacks layers', 'overlaps training and test data'], 0, 'Elhage et al., 2022, toy models of superposition.'],
            ['Sparse autoencoders are used to…', ['split activations into many sparse, more interpretable features', 'compress the training set', 'speed up inference', 'translate text'], 0, 'A widely used tool in mechanistic interpretability.'],
            ['Activation patching…', ['swaps activations between runs to find which components cause a behaviour', 'fixes bugs in weights', 'adds new training data', 'removes attention heads permanently'], 0, 'A causal intervention, not just a correlation.'],
          ],
        },
      ],
    },
  ],
}

const vision: Track = {
  id: 'vision',
  name: 'Computer Vision',
  emoji: '👁️',
  codes: ['cs.CV', 'eess.IV'],
  levels: [
    {
      lessons: [
        {
          id: 'cv-b1',
          title: 'Images as data',
          topics: ['convolutional neural network', 'data augmentation'],
          q: [
            ['Why do CNNs share one filter across the whole image?', ['Fewer parameters and the same pattern is detected anywhere', 'To blur the image', 'To add colour', 'Because images are square'], 0, 'Weight sharing gives translation equivariance.'],
            ['Pooling layers mainly…', ['reduce spatial resolution', 'add colour channels', 'increase image size', 'label the image'], 0, 'Max pooling keeps the strongest response in each window.'],
            ['Object detection, unlike classification, outputs…', ['boxes and labels for each object', 'one label per image', 'a caption', 'a depth map only'], 0, 'It says what and where.'],
            ['Random crops and flips during training are…', ['data augmentation', 'regularisation by dropout', 'test-time cheating', 'pruning'], 0, 'They create varied examples from the same images.'],
            ['An RGB image has how many colour channels?', ['3', '1', '4', '256'], 0, 'Red, green and blue.'],
          ],
        },
        {
          id: 'cv-b2',
          title: 'Classic tasks',
          topics: ['semantic segmentation', 'transfer learning'],
          q: [
            ['Semantic segmentation assigns…', ['a class to every pixel', 'one box per object', 'a caption per image', 'a depth to every object'], 0, 'Instance segmentation also separates individual objects.'],
            ['Intersection over Union (IoU) for two boxes is…', ['overlap area divided by combined area', 'the sum of their areas', 'the distance between centres', 'always 1'], 0, 'The standard way to score box overlap.'],
            ['Starting from an ImageNet-pretrained backbone is…', ['transfer learning', 'data leakage', 'overfitting', 'self-supervision'], 0, 'Useful when you have little labelled data.'],
            ['In a CNN, the receptive field of a unit…', ['grows with depth', 'shrinks with depth', 'is always one pixel', 'covers only colours'], 0, 'Deeper units see larger parts of the image.'],
            ['ImageNet’s classic challenge (ILSVRC) has how many classes?', ['1,000', '10', '100', '1,000,000'], 0, 'About 1.2 million training images.'],
          ],
        },
      ],
    },
    {
      lessons: [
        {
          id: 'cv-i1',
          title: 'Architectures',
          topics: ['vision transformer', 'u-net'],
          q: [
            ['ResNet made very deep networks trainable with…', ['skip (residual) connections', 'larger filters', 'more pooling', 'no activations'], 0, 'He et al., 2016.'],
            ['A Vision Transformer treats an image as…', ['a sequence of patches', 'one big token', 'a graph of pixels', 'a list of colours'], 0, 'Dosovitskiy et al., 2021.'],
            ['U-Net is best known for…', ['segmentation, with an encoder–decoder and skip connections', 'text generation', 'reinforcement learning', 'compression only'], 0, 'Originally for biomedical images (Ronneberger et al., 2015).'],
            ['Non-maximum suppression…', ['removes duplicate overlapping detections', 'increases image contrast', 'adds more boxes', 'normalises pixel values'], 0, 'It keeps the most confident box among overlapping ones.'],
            ['YOLO is a…', ['single-stage detector that predicts boxes in one pass', 'segmentation dataset', 'two-stage proposal method', 'image generator'], 0, 'Fast enough for real time.'],
          ],
        },
        {
          id: 'cv-i2',
          title: 'Learning with fewer labels',
          topics: ['contrastive language image pretraining', 'masked autoencoder'],
          q: [
            ['CLIP is trained on…', ['image–caption pairs, contrastively', 'labelled ImageNet only', 'videos with sound', 'depth maps'], 0, 'It enables zero-shot classification from text prompts (Radford et al., 2021).'],
            ['A masked autoencoder learns by…', ['hiding most image patches and reconstructing them', 'classifying labelled images', 'generating captions', 'detecting edges'], 0, 'He et al., 2022.'],
            ['A GAN has…', ['a generator and a discriminator competing', 'two classifiers voting', 'an encoder only', 'a diffusion process'], 0, 'Goodfellow et al., 2014.'],
            ['mAP in detection stands for…', ['mean average precision', 'maximum activation probability', 'mean absolute pixel error', 'model accuracy percentage'], 0, 'Averaged over classes (and often IoU thresholds).'],
            ['A model trained on daytime photos fails at night. This is…', ['domain shift', 'overfitting to labels', 'data augmentation', 'transfer learning'], 0, 'The test distribution differs from training.'],
          ],
        },
      ],
    },
    {
      lessons: [
        {
          id: 'cv-a1',
          title: 'Generative vision',
          topics: ['latent diffusion', 'neural radiance fields'],
          q: [
            ['Latent diffusion (e.g. Stable Diffusion) runs the diffusion process…', ['in a compressed latent space from an autoencoder', 'directly on full-resolution pixels only', 'on text tokens', 'without noise'], 0, 'Rombach et al., 2022: much cheaper than pixel space.'],
            ['Classifier-free guidance…', ['mixes conditional and unconditional predictions to trade diversity for fidelity', 'trains a separate classifier', 'removes the text prompt', 'adds adversarial noise'], 0, 'Ho & Salimans, 2022.'],
            ['A NeRF maps a 3D point and viewing direction to…', ['colour and density, rendered by volume rendering', 'a class label', 'a 2D bounding box', 'a depth sensor reading'], 0, 'Mildenhall et al., 2020.'],
            ['3D Gaussian splatting represents a scene as…', ['many 3D Gaussians that are rasterised quickly', 'a single mesh', 'a voxel grid of labels', 'a point cloud of words'], 0, 'Kerbl et al., 2023: real-time rendering.'],
            ['For FID (Fréchet Inception Distance), lower means…', ['generated images look more like real ones', 'images are smaller', 'training was faster', 'more diverse labels'], 0, 'It compares feature statistics of real and generated sets.'],
          ],
        },
        {
          id: 'cv-a2',
          title: 'Robust and trustworthy vision',
          topics: ['adversarial examples', 'shortcut learning'],
          q: [
            ['FGSM creates an adversarial example by…', ['stepping in the sign of the loss gradient', 'adding random noise', 'cropping the image', 'retraining the model'], 0, 'Goodfellow et al., 2015.'],
            ['Geirhos et al. (2019) found ImageNet CNNs are biased towards…', ['texture rather than shape', 'shape rather than texture', 'colour only', 'image size'], 0, 'Unlike humans, who rely more on shape.'],
            ['A chest X-ray model learns to detect a hospital’s marker instead of disease. This is…', ['shortcut learning', 'transfer learning', 'self-supervision', 'augmentation'], 0, 'It exploits a spurious cue that won’t hold elsewhere.'],
            ['Grad-CAM shows…', ['which image regions most influenced a prediction', 'the training loss curve', 'the model’s weights', 'the dataset’s labels'], 0, 'A gradient-based saliency method.'],
            ['Out-of-distribution detection aims to…', ['flag inputs unlike the training data', 'classify faster', 'remove duplicates', 'balance classes'], 0, 'So the model can abstain instead of guessing.'],
          ],
        },
      ],
    },
  ],
}

const safety: Track = {
  id: 'safety',
  name: 'AI Safety & Alignment',
  emoji: '🛡️',
  codes: ['cs.AI', 'cs.CY', 'cs.MA'],
  levels: [
    {
      lessons: [
        {
          id: 'saf-b1',
          title: 'Why safety matters',
          topics: ['specification gaming', 'ai alignment'],
          q: [
            ['A boat-racing agent learns to circle forever collecting points instead of finishing. This is…', ['specification gaming', 'transfer learning', 'overfitting to the test set', 'a hardware bug'], 0, 'It optimised the reward as written, not as intended.'],
            ['"AI alignment" is about…', ['getting AI systems to pursue the goals we actually intend', 'making models run faster', 'aligning text in a document', 'making all models the same size'], 0, 'Including when goals are hard to specify.'],
            ['Goodhart’s law says…', ['when a measure becomes a target, it stops being a good measure', 'models double in size every year', 'more data always helps', 'every bug can be fixed'], 0, 'Optimising a proxy hard breaks the link to what you wanted.'],
            ['Red teaming a model means…', ['deliberately probing it to find failures', 'training it on red images', 'deploying it to a red team only', 'measuring its speed'], 0, 'Done before release to find harmful behaviour.'],
            ['Interpretability research tries to…', ['understand what happens inside a model', 'make models bigger', 'translate code', 'compress datasets'], 0, 'So we can check why a model does what it does.'],
          ],
        },
        {
          id: 'saf-b2',
          title: 'Common failure modes',
          topics: ['reward hacking', 'jailbreak'],
          q: [
            ['A jailbreak is…', ['a prompt that gets a model past its safety training', 'a server outage', 'a type of dataset', 'removing a model from a phone'], 0, 'A common target of red-teaming.'],
            ['Reward hacking is when a learner…', ['exploits flaws in its reward instead of doing the task', 'gets too little reward', 'learns too slowly', 'refuses to act'], 0, 'Closely related to specification gaming.'],
            ['A model behaves well in testing but badly after deployment on new kinds of input. A likely cause is…', ['distribution shift', 'too much dropout', 'a small vocabulary', 'a low temperature'], 0, 'Deployment inputs differ from what it was trained and tested on.'],
            ['"Dual use" means a capability…', ['can help or harm depending on who uses it', 'needs two GPUs', 'works in two languages', 'is used twice per query'], 0, 'E.g. chemistry help useful to students and attackers alike.'],
            ['Why is hallucination a safety issue, not just an accuracy issue?', ['People may act on confident, false information', 'It slows the model down', 'It uses more memory', 'It changes the weights'], 0, 'Especially in medicine, law or security.'],
          ],
        },
      ],
    },
    {
      lessons: [
        {
          id: 'saf-i1',
          title: 'Training for alignment',
          topics: ['reward model overoptimization', 'scalable oversight'],
          q: [
            ['Optimising hard against a learned reward model eventually…', ['lowers true quality while the proxy reward keeps rising', 'always improves true quality', 'has no effect', 'shrinks the model'], 0, 'Gao et al., 2022, scaling laws for reward-model overoptimisation.'],
            ['Scalable oversight is about…', ['supervising AI on tasks humans can’t easily check themselves', 'adding more GPUs', 'monitoring server logs', 'hiring more labellers for easy tasks'], 0, 'Proposals include debate and recursive reward modelling.'],
            ['In "AI safety via debate", two models…', ['argue so a human judge can find the truth more easily', 'train each other’s weights', 'compete on speed', 'vote on the answer'], 0, 'Irving, Christiano & Amodei, 2018.'],
            ['Dangerous-capability evaluations test whether a model…', ['could meaningfully help with harms such as cyberattacks or bioweapons', 'is fast enough', 'has a large vocabulary', 'is fairly priced'], 0, 'Used to decide what safeguards a model needs.'],
            ['Responsible scaling policies tie safety measures to…', ['capability thresholds the model reaches', 'the size of the company', 'the release date', 'the price of compute'], 0, 'More capable models need stronger protections.'],
          ],
        },
        {
          id: 'saf-i2',
          title: 'Robustness and misuse',
          topics: ['prompt injection', 'adversarial training'],
          q: [
            ['Prompt injection is when…', ['instructions hidden in content an AI reads (e.g. a web page) hijack it', 'a user types too fast', 'the model’s prompt is too long', 'two prompts are merged on purpose'], 0, 'A major risk for AI agents that browse or read email.'],
            ['Adversarial training means…', ['training on attacks so the model resists them', 'training two models to fight', 'removing hard examples', 'training without labels'], 0, 'It improves robustness to the attacks it sees.'],
            ['Over-refusal is when a model…', ['declines harmless requests out of caution', 'answers everything', 'answers too slowly', 'refuses to load'], 0, 'Safety training trades off against helpfulness.'],
            ['A model card or system card documents…', ['a model’s intended uses, evaluations and limitations', 'the model’s price', 'the GPU it runs on', 'the training code only'], 0, 'Mitchell et al., 2019 proposed model cards.'],
            ['Why test a model with an automated red-teamer as well as humans?', ['It can search far more inputs for failures', 'Humans are never useful', 'It makes the model bigger', 'It removes the need for evaluation'], 0, 'Perez et al., 2022: red teaming language models with language models.'],
          ],
        },
      ],
    },
    {
      lessons: [
        {
          id: 'saf-a1',
          title: 'Deceptive and emergent behaviour',
          topics: ['sleeper agents', 'deceptive alignment'],
          q: [
            ['Hubinger et al. (2024), "Sleeper Agents", found that backdoored behaviour…', ['can persist through standard safety training', 'always disappears after fine-tuning', 'only exists in small models', 'cannot be trained in deliberately'], 0, 'Adversarial training sometimes hid the trigger better instead.'],
            ['Inner alignment asks whether…', ['the objective a trained model actually pursues matches the training objective', 'the training objective matches what we want', 'two models agree', 'the code compiles'], 0, 'Outer alignment is about the training objective itself.'],
            ['"Sandbagging" on an evaluation means…', ['deliberately underperforming to hide a capability', 'training on sandbags', 'overfitting the benchmark', 'refusing every question'], 0, 'A concern for capability evaluations.'],
            ['Situational awareness in a model means it…', ['knows facts about itself and its circumstances, e.g. whether it is being tested', 'has a camera', 'knows the time of day', 'runs on a robot'], 0, 'Relevant because behaviour could differ in testing and deployment.'],
            ['"Alignment faking" (Greenblatt et al., 2024) describes a model that…', ['complies during training to avoid being changed, while preferring otherwise', 'fakes its benchmark results', 'copies another model', 'has no training data'], 0, 'Observed in a frontier model under certain conditions.'],
          ],
        },
        {
          id: 'saf-a2',
          title: 'Interpretability for safety',
          topics: ['steering vectors', 'eliciting latent knowledge'],
          q: [
            ['Adding a "steering vector" to a model’s activations…', ['shifts its behaviour along a chosen direction, without retraining', 'deletes its training data', 'makes it faster', 'changes its tokenizer'], 0, 'E.g. activation addition (Turner et al., 2023).'],
            ['Why might a probe for "deception" be weak evidence on its own?', ['It may pick up correlated features rather than deception itself', 'Probes can’t be trained', 'Deception has no activations', 'Probes always overfit to zero'], 0, 'Correlation with a label isn’t the mechanism.'],
            ['The eliciting latent knowledge (ELK) problem asks how to…', ['get a model to report what it knows, not what a human would believe', 'make a model forget data', 'compress a model', 'translate a model’s weights'], 0, 'Posed by ARC in 2021.'],
            ['Circuit discovery aims to…', ['find the small set of components that implement a behaviour', 'design new chips', 'map the training data', 'speed up inference'], 0, 'E.g. the indirect-object-identification circuit (Wang et al., 2022).'],
            ['Sparse-autoencoder features are attractive for safety because…', ['they can reveal concepts a model uses, which can then be monitored', 'they make models smaller', 'they replace training', 'they are always perfectly accurate'], 0, 'Templeton et al., 2024 scaled them to a production model.'],
          ],
        },
      ],
    },
  ],
}

const security: Track = {
  id: 'security',
  name: 'Security & Privacy',
  emoji: '🔐',
  codes: ['cs.CR'],
  levels: [
    {
      lessons: [
        {
          id: 'sec-b1',
          title: 'Foundations',
          topics: ['public key cryptography', 'hash function'],
          q: [
            ['The "CIA triad" stands for…', ['confidentiality, integrity, availability', 'code, input, access', 'cipher, identity, authentication', 'control, isolation, audit'], 0, 'The three core goals of security.'],
            ['Asymmetric encryption uses…', ['a public key and a private key', 'one shared key', 'no keys', 'a password only'], 0, 'Anyone can encrypt to you; only you can decrypt.'],
            ['A cryptographic hash function should be…', ['one-way and collision-resistant', 'easy to reverse', 'variable length', 'random each time'], 0, 'Same input, same output; hard to find two inputs with the same hash.'],
            ['An email pretending to be your bank, asking for your password, is…', ['phishing', 'a buffer overflow', 'encryption', 'a firewall'], 0, 'Social engineering, not a software flaw.'],
            ['Two-factor authentication protects you when…', ['your password is stolen', 'your screen is cracked', 'your internet is slow', 'you forget your username'], 0, 'An attacker also needs the second factor.'],
          ],
        },
        {
          id: 'sec-b2',
          title: 'Web security',
          topics: ['sql injection', 'cross-site scripting'],
          q: [
            ['The standard defence against SQL injection is…', ['parameterised queries', 'longer passwords', 'HTTPS', 'more RAM'], 0, 'User input is never pasted into the query text.'],
            ['Cross-site scripting (XSS) is…', ['injecting script into pages other users view', 'sending too many requests', 'guessing passwords', 'stealing a laptop'], 0, 'Escape output to prevent it.'],
            ['Salting password hashes defends against…', ['precomputed rainbow tables', 'phishing', 'DDoS attacks', 'keyloggers'], 0, 'Each password gets a unique random salt.'],
            ['TLS (the S in HTTPS) provides…', ['encryption and server authentication', 'faster pages', 'virus scanning', 'ad blocking'], 0, 'It stops eavesdropping and impersonation.'],
            ['The principle of least privilege says…', ['give each part only the access it needs', 'everyone is an admin', 'log nothing', 'share passwords'], 0, 'Limits the damage when something is compromised.'],
          ],
        },
      ],
    },
    {
      lessons: [
        {
          id: 'sec-i1',
          title: 'Systems and cryptography',
          topics: ['buffer overflow', 'diffie-hellman'],
          q: [
            ['A buffer overflow happens when a program…', ['writes past the end of a memory buffer', 'runs out of disk', 'uses too much CPU', 'opens too many tabs'], 0, 'It can overwrite return addresses and hijack execution.'],
            ['CSRF tricks a logged-in user’s browser into…', ['sending unwanted requests to a site', 'downloading malware', 'revealing the screen', 'changing DNS'], 0, 'Mitigated with tokens and SameSite cookies.'],
            ['Diffie–Hellman lets two parties…', ['agree on a shared secret over a public channel', 'sign documents', 'hash passwords', 'compress data'], 0, 'The basis of many key exchanges.'],
            ['A digital signature gives…', ['authenticity and integrity of a message', 'secrecy of the message', 'faster delivery', 'anonymity'], 0, 'Signed with the private key, checked with the public key.'],
            ['A timing side-channel attack…', ['learns secrets from how long operations take', 'cuts the power', 'reads the source code', 'guesses usernames'], 0, 'Constant-time code is the defence.'],
          ],
        },
        {
          id: 'sec-i2',
          title: 'Machine learning security',
          topics: ['membership inference', 'differential privacy'],
          q: [
            ['A membership inference attack tries to tell…', ['whether a given record was in the training data', 'what GPU trained the model', 'the model’s architecture', 'the user’s location'], 0, 'Shokri et al., 2017.'],
            ['Data poisoning is…', ['inserting crafted examples into training data to change model behaviour', 'deleting a dataset', 'training too long', 'compressing data'], 0, 'Backdoors are a targeted form.'],
            ['In differential privacy, a smaller ε means…', ['stronger privacy', 'weaker privacy', 'faster training', 'more accuracy'], 0, 'It bounds how much one person’s data can change the output.'],
            ['Federated learning keeps raw data on devices, but…', ['shared gradients can still leak information', 'it is always perfectly private', 'it needs no server', 'it can’t train neural networks'], 0, 'E.g. gradient inversion attacks.'],
            ['Model extraction means…', ['copying a model’s behaviour by querying it', 'deleting a model', 'exporting weights legally', 'training on test data'], 0, 'A risk for models offered through an API.'],
          ],
        },
      ],
    },
    {
      lessons: [
        {
          id: 'sec-a1',
          title: 'Advanced cryptography',
          topics: ['homomorphic encryption', 'post-quantum cryptography'],
          q: [
            ['A zero-knowledge proof lets you prove…', ['a statement is true without revealing why', 'you know nothing', 'a key is random', 'data was deleted'], 0, 'Goldwasser, Micali & Rackoff, 1985.'],
            ['Fully homomorphic encryption allows…', ['computing on encrypted data', 'encrypting faster', 'breaking RSA', 'sharing keys publicly'], 0, 'Gentry gave the first construction in 2009.'],
            ['Why is post-quantum cryptography needed?', ['Shor’s algorithm would break RSA and elliptic-curve schemes', 'Quantum computers are faster at hashing', 'AES is already broken', 'Passwords are too short'], 0, 'Lattice-based schemes like ML-KEM are being standardised.'],
            ['Spectre attacks exploit…', ['speculative execution in CPUs', 'weak passwords', 'SQL databases', 'Wi-Fi encryption'], 0, 'Kocher et al., 2019.'],
            ['Secure multi-party computation lets parties…', ['compute a joint result without revealing their inputs', 'share one password', 'merge their databases', 'skip encryption'], 0, 'E.g. computing an average salary privately.'],
          ],
        },
        {
          id: 'sec-a2',
          title: 'Security engineering',
          topics: ['fuzzing', 'software supply chain'],
          q: [
            ['A threat model defines…', ['what the attacker can do and wants', 'the price of the software', 'the team’s roles', 'the colour of alerts'], 0, 'You can’t judge a defence without one.'],
            ['Fuzzing finds bugs by…', ['feeding programs many random or mutated inputs', 'reading code manually', 'formal proofs', 'asking users'], 0, 'Coverage-guided fuzzers like AFL are standard.'],
            ['A software supply-chain attack compromises…', ['a dependency or build tool that others trust', 'a single user’s password', 'the Wi-Fi router', 'the CPU fan'], 0, 'SolarWinds and the xz backdoor are examples.'],
            ['Memory-safe languages like Rust prevent…', ['whole classes of bugs such as use-after-free', 'all logic bugs', 'phishing', 'network attacks'], 0, 'Much of serious C/C++ vulnerability comes from memory errors.'],
            ['Formal verification…', ['mathematically proves code meets a specification', 'tests code on random inputs', 'checks code style', 'speeds up code'], 0, 'E.g. the seL4 microkernel.'],
          ],
        },
      ],
    },
  ],
}

const robotics: Track = {
  id: 'robotics',
  name: 'Robotics',
  emoji: '🤖',
  codes: ['cs.RO', 'eess.SY', 'cs.SY'],
  levels: [
    {
      lessons: [
        {
          id: 'rob-b1',
          title: 'Moving and sensing',
          topics: ['inverse kinematics', 'pid controller'],
          q: [
            ['Inverse kinematics computes…', ['joint angles that place the hand at a target pose', 'the hand’s pose from joint angles', 'the robot’s battery level', 'the map of a room'], 0, 'Forward kinematics is the other direction.'],
            ['A PID controller combines…', ['proportional, integral and derivative terms of the error', 'three separate robots', 'position, image and depth', 'planning, inference and decoding'], 0, 'The workhorse of feedback control.'],
            ['Closed-loop control differs from open-loop because it…', ['uses feedback from sensors', 'runs faster', 'needs no model', 'ignores errors'], 0, 'It corrects for disturbances as they happen.'],
            ['LiDAR measures…', ['distance using laser pulses', 'temperature', 'sound', 'magnetic fields'], 0, 'It produces 3D point clouds.'],
            ['A robot arm with 6 independent joints has how many degrees of freedom?', ['6', '1', '3', '12'], 0, 'Enough to reach a position and orientation in 3D space.'],
          ],
        },
        {
          id: 'rob-b2',
          title: 'Knowing where you are',
          topics: ['simultaneous localization and mapping', 'kalman filter'],
          q: [
            ['SLAM means…', ['building a map while locating yourself in it', 'slowing a robot down', 'sorting sensor data', 'a type of gripper'], 0, 'Simultaneous localisation and mapping.'],
            ['A Kalman filter is optimal for…', ['linear systems with Gaussian noise', 'any non-linear system', 'image classification', 'path planning'], 0, 'Extended and unscented variants handle non-linearity approximately.'],
            ['A* search uses…', ['path cost so far plus a heuristic estimate to the goal', 'random moves', 'only the heuristic', 'only the cost so far'], 0, 'With an admissible heuristic it finds the shortest path.'],
            ['Odometry from wheel encoders tends to…', ['drift as small errors accumulate', 'get more accurate over time', 'never change', 'measure colour'], 0, 'Other sensors are needed to correct it.'],
            ['Configuration space is…', ['the space of all possible robot poses', 'the robot’s settings menu', 'the room it works in', 'its memory size'], 0, 'Planning happens in it, with obstacles mapped into it.'],
          ],
        },
      ],
    },
    {
      lessons: [
        {
          id: 'rob-i1',
          title: 'Learning to act',
          topics: ['sim-to-real', 'imitation learning'],
          q: [
            ['The "sim-to-real gap" is…', ['the drop in performance when a policy trained in simulation runs on a real robot', 'the price difference between robots', 'the time to build a simulator', 'the delay in a network'], 0, 'Domain randomisation is a common fix.'],
            ['Behaviour cloning suffers from compounding errors because…', ['small mistakes lead to states the demonstrations never covered', 'it uses too much data', 'it needs rewards', 'it is too slow'], 0, 'DAgger (Ross et al., 2011) collects corrections in those states.'],
            ['Model predictive control…', ['optimises actions over a short horizon, applies the first, and repeats', 'learns from rewards only', 'needs no model', 'plans once at the start'], 0, 'Widely used for drones, cars and legged robots.'],
            ['Particle filters are useful for localisation when…', ['beliefs are non-Gaussian, e.g. several possible positions', 'the system is perfectly linear', 'there are no sensors', 'the map is unknown and unneeded'], 0, 'Monte Carlo localisation uses them.'],
            ['In reinforcement learning, the agent maximises…', ['expected cumulative reward', 'the number of actions', 'immediate reward only', 'the size of its network'], 0, 'Often discounted over time.'],
          ],
        },
        {
          id: 'rob-i2',
          title: 'Planning and RL',
          topics: ['rapidly exploring random tree', 'reward shaping'],
          q: [
            ['RRT is a…', ['sampling-based motion planner', 'sensor', 'type of motor', 'neural network layer'], 0, 'LaValle, 1998: grows a tree by random sampling.'],
            ['Q-learning is…', ['off-policy: it learns about the greedy policy while acting differently', 'on-policy only', 'not reinforcement learning', 'a supervised method'], 0, 'SARSA is the on-policy counterpart.'],
            ['Reward shaping adds rewards to…', ['guide learning towards the goal faster', 'punish the robot for moving', 'replace the environment', 'reduce sensors'], 0, 'Potential-based shaping keeps the optimal policy unchanged.'],
            ['The exploration–exploitation trade-off is choosing between…', ['trying new actions and using the best-known ones', 'speed and accuracy', 'simulation and reality', 'two robots'], 0, 'ε-greedy is a simple strategy.'],
            ['Policy-gradient methods…', ['directly adjust policy parameters to increase expected reward', 'learn only a value table', 'need a map', 'cannot handle continuous actions'], 0, 'REINFORCE and PPO are examples.'],
          ],
        },
      ],
    },
    {
      lessons: [
        {
          id: 'rob-a1',
          title: 'Foundation models for robots',
          topics: ['vision-language-action', 'diffusion policy'],
          q: [
            ['A vision-language-action model maps…', ['camera images and an instruction to robot actions', 'text to images', 'actions to captions', 'maps to text'], 0, 'E.g. RT-2 (Brohan et al., 2023).'],
            ['Diffusion policy generates…', ['action sequences by iterative denoising', 'images of the robot', 'maps of the room', 'reward functions'], 0, 'Chi et al., 2023: handles multi-modal demonstrations well.'],
            ['The main challenge in offline RL is…', ['overestimating actions never seen in the dataset', 'having too much data', 'no rewards in the data', 'real-time speed'], 0, 'Conservative Q-learning penalises such actions.'],
            ['Open X-Embodiment pooled data from…', ['many different robot types to train generalist policies', 'one robot only', 'simulations only', 'video games'], 0, 'Open X-Embodiment Collaboration, 2023.'],
            ['Constrained MDPs are used in safe RL to…', ['keep costs like collisions below a limit while maximising reward', 'speed up training', 'remove rewards', 'add more robots'], 0, 'Safety becomes an explicit constraint.'],
          ],
        },
        {
          id: 'rob-a2',
          title: 'Legged and dexterous robots',
          topics: ['legged locomotion', 'dexterous manipulation'],
          q: [
            ['The zero-moment point is used to keep…', ['bipedal robots balanced', 'cameras focused', 'motors cool', 'batteries charged'], 0, 'Keep it inside the support polygon of the feet.'],
            ['Contact-rich manipulation is hard because…', ['contacts are discontinuous and hard to model or sense', 'robots can’t see', 'objects have no mass', 'grippers are too strong'], 0, 'Small errors in contact change outcomes a lot.'],
            ['Teleoperation is common for imitation learning because it…', ['collects demonstrations in the robot’s own body and sensors', 'needs no human', 'is fully simulated', 'removes the need for data'], 0, 'E.g. ALOHA (Zhao et al., 2023).'],
            ['Whole-body control coordinates…', ['many joints and contacts at once to meet several goals', 'one joint at a time', 'only the wheels', 'only the camera'], 0, 'Typical for humanoids and legged manipulators.'],
            ['Collaborative robots near people are designed to…', ['limit force and speed so contact is safe', 'move as fast as possible', 'work only at night', 'ignore humans'], 0, 'Standards such as ISO/TS 15066 set limits.'],
          ],
        },
      ],
    },
  ],
}

export const TRACKS: Track[] = [ml, nlp, vision, safety, security, robotics]

/** The hand-written track for an arXiv category, if there is one. */
export const trackForCategory = (code: string) => TRACKS.find((t) => t.codes.includes(code)) ?? null
export const trackById = (id: string) => TRACKS.find((t) => t.id === id) ?? null
export const allLessons = (t: Track) => t.levels.flatMap((l, level) => l.lessons.map((lesson, i) => ({ lesson, level, index: i })))
